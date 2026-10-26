package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayIpnResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@Service
public class VnPayIpnService {

    private static final String PENDING = "PENDING";
    private static final String FAILED = "FAILED";
    private static final String SUCCESS = "SUCCESS";
    private static final String RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED";
    private static final BigInteger MAX_VNPAY_AMOUNT = new BigInteger("999999999999");

    private final VnPayProperties properties;
    private final VnPaySignatureService signatureService;
    private final PaymentTransactionAttemptRepository attemptRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    public VnPayIpnService(
            VnPayProperties properties,
            VnPaySignatureService signatureService,
            PaymentTransactionAttemptRepository attemptRepository,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            PaymentService paymentService) {
        this.properties = properties;
        this.signatureService = signatureService;
        this.attemptRepository = attemptRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
    }

    @Transactional
    public VnPayIpnResponse process(Map<String, List<String>> parameters) {
        if (!signatureService.hasValidCallbackSignature(parameters)) {
            return response("97", "Invalid signature");
        }
        if (!hasSingleValue(parameters, "vnp_Amount")) {
            return response("04", "Invalid amount");
        }
        if (!hasRequiredParameters(parameters)
                || !matchesMerchant(parameters.get("vnp_TmnCode").get(0))) {
            return response("99", "Invalid callback data");
        }

        String txnRef = value(parameters, "vnp_TxnRef");
        String responseCode = value(parameters, "vnp_ResponseCode");
        String transactionStatus = value(parameters, "vnp_TransactionStatus");
        String transactionNo = value(parameters, "vnp_TransactionNo");
        String bankCode = value(parameters, "vnp_BankCode");
        Long callbackAmount = parseAmount(value(parameters, "vnp_Amount"));
        if (callbackAmount == null) {
            return response("04", "Invalid amount");
        }
        if (!txnRef.matches("[A-Za-z0-9]{1,100}")
                || !responseCode.matches("[0-9]{2}")
                || !transactionStatus.matches("[0-9]{2}")
                || !transactionNo.matches("[0-9]{1,15}")
                || !bankCode.matches("[A-Za-z0-9]{3,20}")
                || value(parameters, "vnp_OrderInfo").length() > 255) {
            return response("99", "Invalid callback data");
        }

        PaymentTransactionAttempt locatedAttempt = attemptRepository.findByTxnRef(txnRef)
                .orElse(null);
        if (locatedAttempt == null) {
            return response("01", "Transaction not found");
        }

        Long orderId = locatedAttempt.getPayment().getOrder().getId();
        Order order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null) {
            return response("01", "Transaction not found");
        }
        Payment payment = paymentRepository.findByOrder_IdForUpdate(orderId).orElse(null);
        PaymentTransactionAttempt attempt = attemptRepository.findByTxnRefForUpdate(txnRef)
                .orElse(null);
        if (payment == null
                || attempt == null
                || !attempt.getPayment().getId().equals(payment.getId())
                || !"VNPAY".equalsIgnoreCase(payment.getPaymentMethod())) {
            return response("01", "Transaction not found");
        }
        if (!("Thanh toan don hang " + order.getId())
                .equals(value(parameters, "vnp_OrderInfo"))) {
            return response("99", "Invalid callback data");
        }
        if (!matchesCallbackAmount(callbackAmount, attempt)
                || !matchesDatabaseAmount(order, payment, attempt)) {
            return response("04", "Invalid amount");
        }

        if (!PENDING.equalsIgnoreCase(attempt.getStatus())) {
            if (matchesRecordedResult(attempt, responseCode, transactionStatus, transactionNo, bankCode)) {
                return response("02", "Transaction already confirmed");
            }
            recordCallback(attempt, responseCode, transactionStatus, transactionNo, bankCode);
            attempt.setStatus(RECONCILIATION_REQUIRED);
            attemptRepository.save(attempt);
            return response("00", "Transaction recorded for reconciliation");
        }

        recordCallback(attempt, responseCode, transactionStatus, transactionNo, bankCode);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        attempt.setCompletedAt(now);

        if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
            if (!PENDING.equalsIgnoreCase(payment.getStatus())
                    || !"PENDING".equalsIgnoreCase(order.getStatus())) {
                attempt.setStatus(RECONCILIATION_REQUIRED);
                attemptRepository.save(attempt);
                return response("00", "Transaction recorded for reconciliation");
            }
            attempt.setStatus(SUCCESS);
            attempt.setUpdatedAt(now);
            paymentService.completeVnPayPayment(payment, order, transactionNo);
        } else if (!"00".equals(responseCode) && !"00".equals(transactionStatus)) {
            if (PENDING.equalsIgnoreCase(payment.getStatus())) {
                payment.setStatus(FAILED);
                payment.setPaidAt(null);
                paymentRepository.save(payment);
                attempt.setStatus(FAILED);
                attempt.setUpdatedAt(now);
            } else {
                attempt.setStatus(RECONCILIATION_REQUIRED);
            }
        } else {
            attempt.setStatus(RECONCILIATION_REQUIRED);
            attempt.setUpdatedAt(now);
        }
        attemptRepository.save(attempt);
        return response("00", "Confirm Success");
    }

    private boolean hasRequiredParameters(Map<String, List<String>> parameters) {
        if (parameters == null) return false;
        for (String name : List.of(
                "vnp_TmnCode",
                "vnp_Amount",
                "vnp_BankCode",
                "vnp_OrderInfo",
                "vnp_TransactionNo",
                "vnp_ResponseCode",
                "vnp_TransactionStatus",
                "vnp_TxnRef",
                "vnp_SecureHash")) {
            if (!StringUtils.hasText(value(parameters, name))) return false;
        }
        return true;
    }

    private boolean hasSingleValue(Map<String, List<String>> parameters, String name) {
        if (parameters == null) return false;
        List<String> values = parameters.get(name);
        return values != null && values.size() == 1 && StringUtils.hasText(values.get(0));
    }

    private boolean matchesMerchant(String callbackMerchant) {
        return StringUtils.hasText(properties.getTmnCode())
                && properties.getTmnCode().trim().equals(callbackMerchant);
    }

    private Long parseAmount(String amount) {
        if (amount == null || !amount.matches("[0-9]{1,12}")) return null;
        try {
            BigInteger parsed = new BigInteger(amount);
            if (parsed.signum() <= 0 || parsed.compareTo(MAX_VNPAY_AMOUNT) > 0) return null;
            return parsed.longValueExact();
        } catch (ArithmeticException exception) {
            return null;
        }
    }

    private boolean matchesDatabaseAmount(
            Order order,
            Payment payment,
            PaymentTransactionAttempt attempt) {
        BigDecimal total = order.getTotalAmount();
        BigDecimal discount = order.getDiscountAmount();
        if (total == null
                || discount == null
                || total.signum() <= 0
                || discount.signum() < 0
                || discount.compareTo(total) > 0
                || payment.getAmount() == null
                || attempt.getAmountVnd() == null) {
            return false;
        }
        BigDecimal payable = total.subtract(discount);
        if (payable.signum() <= 0 || payment.getAmount().compareTo(payable) != 0) {
            return false;
        }
        try {
            return payable.longValueExact() == attempt.getAmountVnd();
        } catch (IllegalArgumentException exception) {
            return false;
        } catch (ArithmeticException exception) {
            return false;
        }
    }

    private boolean matchesCallbackAmount(
            Long callbackAmount,
            PaymentTransactionAttempt attempt) {
        if (callbackAmount == null
                || attempt.getAmountVnd() == null
                || attempt.getAmountVnd() <= 0) {
            return false;
        }
        try {
            long expectedProviderAmount = VnPaySignatureService.toVnPayAmount(
                    BigDecimal.valueOf(attempt.getAmountVnd()));
            return callbackAmount == expectedProviderAmount;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private boolean matchesRecordedResult(
            PaymentTransactionAttempt attempt,
            String responseCode,
            String transactionStatus,
            String transactionNo,
            String bankCode) {
        return responseCode.equals(attempt.getResponseCode())
                && transactionStatus.equals(attempt.getTransactionStatus())
                && transactionNo.equals(attempt.getProviderTransactionNo())
                && bankCode.equals(attempt.getBankCode());
    }

    private void recordCallback(
            PaymentTransactionAttempt attempt,
            String responseCode,
            String transactionStatus,
            String transactionNo,
            String bankCode) {
        attempt.setResponseCode(responseCode);
        attempt.setTransactionStatus(transactionStatus);
        attempt.setProviderTransactionNo(transactionNo);
        attempt.setBankCode(bankCode);
        attempt.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
    }

    private String value(Map<String, List<String>> parameters, String name) {
        if (parameters == null) return null;
        List<String> values = parameters.get(name);
        return values == null || values.size() != 1 ? null : values.get(0);
    }

    private VnPayIpnResponse response(String code, String message) {
        return new VnPayIpnResponse(code, message);
    }
}
