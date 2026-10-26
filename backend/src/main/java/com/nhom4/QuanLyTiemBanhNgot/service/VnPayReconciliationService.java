package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayPaymentStatusResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayReconciliationResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class VnPayReconciliationService {

    private static final ZoneId VNPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnPayProperties properties;
    private final AuthenticatedCustomerResolver customerResolver;
    private final PaymentTransactionAttemptRepository attemptRepository;
    private final VnPaySignatureService signatureService;
    private final VnPayQueryClient queryClient;
    private final VnPayReconciliationPersistenceService persistenceService;
    private final ConcurrentHashMap<String, Instant> recentQueries = new ConcurrentHashMap<>();

    public VnPayReconciliationService(
            VnPayProperties properties,
            AuthenticatedCustomerResolver customerResolver,
            PaymentTransactionAttemptRepository attemptRepository,
            VnPaySignatureService signatureService,
            VnPayQueryClient queryClient,
            VnPayReconciliationPersistenceService persistenceService) {
        this.properties = properties;
        this.customerResolver = customerResolver;
        this.attemptRepository = attemptRepository;
        this.signatureService = signatureService;
        this.queryClient = queryClient;
        this.persistenceService = persistenceService;
    }

    public VnPayReconciliationResponse reconcile(String username, String transactionReference) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        if (transactionReference == null
                || !transactionReference.matches("[A-Za-z0-9]{1,100}")) {
            throw new ResourceNotFoundException("Không tìm thấy giao dịch");
        }

        PaymentTransactionAttempt attempt = attemptRepository
                .findByTxnRefAndCustomerId(transactionReference, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));
        if ("SUCCESS".equalsIgnoreCase(attempt.getStatus())
                && "SUCCESS".equalsIgnoreCase(attempt.getPayment().getStatus())) {
            return new VnPayReconciliationResponse(
                    statusOf(attempt),
                    "Thanh toán đã được xác nhận."
            );
        }
        if (!claimQuerySlot(transactionReference)) {
            return new VnPayReconciliationResponse(
                    statusOf(attempt),
                    "Vừa kiểm tra giao dịch. Vui lòng chờ một chút rồi thử lại."
            );
        }

        Map<String, String> response = queryClient.query(createSignedQuery(attempt));
        validateQueryResponse(response, attempt);
        if (!"00".equals(response.get("vnp_ResponseCode"))) {
            return new VnPayReconciliationResponse(
                    statusOf(attempt),
                    "Chưa thể xác nhận giao dịch. Trạng thái đơn hàng chưa thay đổi."
            );
        }
        if (!"00".equals(response.get("vnp_TransactionStatus"))) {
            return new VnPayReconciliationResponse(
                    statusOf(attempt),
                    "Giao dịch chưa thành công. Trạng thái đơn hàng chưa thay đổi."
            );
        }

        VnPayPaymentStatusResponse updated = persistenceService.recordVerifiedSuccess(
                transactionReference,
                response.get("vnp_TransactionNo"),
                response.get("vnp_BankCode")
        );
        return new VnPayReconciliationResponse(
                updated,
                "Thanh toán đã được xác nhận."
        );
    }

    private Map<String, String> createSignedQuery(PaymentTransactionAttempt attempt) {
        String tmnCode = properties.getTmnCode();
        if (!StringUtils.hasText(tmnCode)) {
            throw new IllegalStateException("VNPay TMN code is not configured");
        }
        Order order = attempt.getPayment().getOrder();
        String transactionDate = attempt.getTransactionDate();
        if (transactionDate == null || !transactionDate.matches("[0-9]{14}")) {
            transactionDate = attempt.getCreatedAt()
                    .atZone(ZoneOffset.UTC)
                    .withZoneSameInstant(VNPAY_ZONE)
                    .format(VNPAY_DATE_FORMAT);
        }

        Map<String, String> parameters = new LinkedHashMap<>();
        parameters.put("vnp_RequestId", UUID.randomUUID().toString().replace("-", ""));
        parameters.put("vnp_Version", "2.1.0");
        parameters.put("vnp_Command", "querydr");
        parameters.put("vnp_TmnCode", tmnCode.trim());
        parameters.put("vnp_TxnRef", attempt.getTxnRef());
        parameters.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        parameters.put("vnp_TransactionDate", transactionDate);
        parameters.put(
                "vnp_CreateDate",
                LocalDateTime.now(VNPAY_ZONE).format(VNPAY_DATE_FORMAT)
        );
        parameters.put("vnp_IpAddr", localServerAddress());
        parameters.put("vnp_SecureHash", signatureService.signQueryRequest(parameters));
        return Map.copyOf(parameters);
    }

    private void validateQueryResponse(
            Map<String, String> response,
            PaymentTransactionAttempt attempt) {
        if (!signatureService.hasValidQueryResponseSignature(response)) {
            throw new IllegalStateException("VNPay query response signature is invalid");
        }
        Order order = attempt.getPayment().getOrder();
        String amount = Long.toString(VnPaySignatureService.toVnPayAmount(
                BigDecimal.valueOf(attempt.getAmountVnd())));
        if (!response.getOrDefault("vnp_ResponseId", "").matches("[A-Za-z0-9]{1,32}")
                || (response.containsKey("vnp_Command")
                && !"querydr".equals(response.get("vnp_Command")))
                || !properties.getTmnCode().trim().equals(response.get("vnp_TmnCode"))
                || !attempt.getTxnRef().equals(response.get("vnp_TxnRef"))
                || !amount.equals(response.get("vnp_Amount"))
                || !("Thanh toan don hang " + order.getId())
                .equals(response.get("vnp_OrderInfo"))
                || !response.getOrDefault("vnp_TransactionType", "").matches("[0-9]{2}")
                || !response.getOrDefault("vnp_TransactionNo", "").matches("[0-9]{1,15}")
                || !response.getOrDefault("vnp_BankCode", "").matches("[A-Za-z0-9]{3,20}")
                || !response.getOrDefault("vnp_ResponseCode", "").matches("[0-9]{2}")
                || !response.getOrDefault("vnp_TransactionStatus", "").matches("[0-9]{2}")) {
            throw new IllegalStateException("VNPay query response does not match the payment attempt");
        }
    }

    private VnPayPaymentStatusResponse statusOf(PaymentTransactionAttempt attempt) {
        return new VnPayPaymentStatusResponse(
                attempt.getPayment().getOrder().getId(),
                attempt.getPayment().getOrder().getStatus(),
                attempt.getPayment().getStatus(),
                attempt.getPayment().getPaidAt(),
                attempt.getStatus(),
                attempt.getUpdatedAt()
        );
    }

    private String localServerAddress() {
        try {
            String address = InetAddress.getLocalHost().getHostAddress();
            if (!address.matches("[0-9A-Fa-f:.]{7,45}")) {
                throw new IllegalStateException("Local server IP address is invalid");
            }
            return address;
        } catch (UnknownHostException exception) {
            throw new IllegalStateException("Unable to determine local server IP address", exception);
        }
    }

    private boolean claimQuerySlot(String transactionReference) {
        Instant now = Instant.now();
        recentQueries.entrySet().removeIf(
                entry -> Duration.between(entry.getValue(), now).toMinutes() >= 1
        );
        AtomicBoolean claimed = new AtomicBoolean();
        recentQueries.compute(transactionReference, (reference, lastQuery) -> {
            if (lastQuery == null || Duration.between(lastQuery, now).getSeconds() >= 15) {
                claimed.set(true);
                return now;
            }
            return lastQuery;
        });
        return claimed.get();
    }
}
