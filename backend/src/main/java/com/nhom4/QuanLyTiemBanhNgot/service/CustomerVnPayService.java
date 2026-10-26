package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreateVnPayPaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayPaymentInitiationResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomerVnPayService {

    private static final DateTimeFormatter VNPAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VNPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AuthenticatedCustomerResolver customerResolver;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionAttemptRepository attemptRepository;
    private final VnPayProperties vnPayProperties;
    private final VnPaySignatureService signatureService;

    public CustomerVnPayService(
            AuthenticatedCustomerResolver customerResolver,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            PaymentTransactionAttemptRepository attemptRepository,
            VnPayProperties vnPayProperties,
            VnPaySignatureService signatureService) {
        this.customerResolver = customerResolver;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.attemptRepository = attemptRepository;
        this.vnPayProperties = vnPayProperties;
        this.signatureService = signatureService;
    }

    @Transactional
    public VnPayPaymentInitiationResponse createPayment(
            String username,
            CreateVnPayPaymentRequest request,
            String clientIpAddress) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        if (request == null || request.orderId() == null) {
            throw new BadRequestException(
                    "Thông tin thanh toán không hợp lệ"
            );
        }
        if (!StringUtils.hasText(clientIpAddress)) {
            throw new BadRequestException(
                    "Không xác định được địa chỉ IP của yêu cầu"
            );
        }

        Order order = orderRepository.findByIdForUpdate(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng với ID: " + request.orderId()
                ));
        if (order.getCustomer() == null
                || !customer.getId().equals(order.getCustomer().getId())) {
            throw new ResourceNotFoundException(
                    "Không tìm thấy đơn hàng với ID: " + request.orderId()
            );
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new ConflictException(
                    "Chỉ có thể thanh toán đơn hàng đang ở trạng thái PENDING"
            );
        }

        BigDecimal amount = calculatePayableAmount(order);
        VnPaySignatureService.toVnPayAmount(amount);
        vnPayProperties.requireHashSecret();

        Payment payment = paymentRepository.findByOrder_IdForUpdate(order.getId())
                .orElse(null);
        if (payment == null) {
            payment = new Payment();
            payment.setOrder(order);
            payment.setPaymentMethod("VNPAY");
            payment.setAmount(amount);
            payment.setStatus("PENDING");
            payment.setPaidAt(null);
            payment = paymentRepository.saveAndFlush(payment);
        } else {
            validateExistingPayment(payment, amount);
        }

        List<PaymentTransactionAttempt> attempts =
                attemptRepository.findByPayment_IdOrderByCreatedAtDesc(payment.getId());
        if (hasUnresolvedAttempt(attempts)) {
            throw new ConflictException(
                    "Giao dịch VNPay trước đó đang chờ kết quả hoặc cần đối soát"
            );
        }

        String transactionReference = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime createdAtVn = LocalDateTime.now(VNPAY_ZONE);
        Map<String, String> parameters = Map.of(
                "vnp_TxnRef", transactionReference,
                "vnp_OrderInfo", "Thanh toan don hang " + order.getId(),
                "vnp_OrderType", "other",
                "vnp_Locale", "vn",
                "vnp_IpAddr", clientIpAddress.trim(),
                "vnp_CreateDate", createdAtVn.format(VNPAY_DATE_FORMAT),
                "vnp_ExpireDate", createdAtVn.plusMinutes(15).format(VNPAY_DATE_FORMAT)
        );
        String paymentUrl = signatureService.createQrPaymentUrl(parameters, amount);

        PaymentTransactionAttempt attempt = new PaymentTransactionAttempt();
        attempt.setPayment(payment);
        attempt.setTxnRef(transactionReference);
        attempt.setAmountVnd(amount.longValueExact());
        attempt.setTransactionDate(createdAtVn.format(VNPAY_DATE_FORMAT));
        attempt.setStatus("PENDING");
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        attempt.setCreatedAt(nowUtc);
        attempt.setUpdatedAt(nowUtc);
        attemptRepository.save(attempt);

        return new VnPayPaymentInitiationResponse(
                payment.getId(),
                transactionReference,
                paymentUrl
        );
    }

    private BigDecimal calculatePayableAmount(Order order) {
        BigDecimal totalAmount = order.getTotalAmount();
        BigDecimal discountAmount = order.getDiscountAmount();
        if (totalAmount == null
                || discountAmount == null
                || totalAmount.signum() <= 0
                || discountAmount.signum() < 0
                || discountAmount.compareTo(totalAmount) > 0) {
            throw new ConflictException(
                    "Tổng tiền hoặc tiền giảm giá của đơn hàng không hợp lệ"
            );
        }
        BigDecimal amount = totalAmount.subtract(discountAmount);
        if (amount.signum() <= 0) {
            throw new ConflictException(
                    "Số tiền thanh toán phải lớn hơn 0"
            );
        }
        return amount;
    }

    private void validateExistingPayment(Payment payment, BigDecimal amount) {
        if (!"VNPAY".equalsIgnoreCase(payment.getPaymentMethod())) {
            throw new ConflictException(
                    "Đơn hàng đã có phương thức thanh toán khác"
            );
        }
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            throw new ConflictException("Đơn hàng đã được thanh toán");
        }
        if (!"PENDING".equalsIgnoreCase(payment.getStatus())
                && !"FAILED".equalsIgnoreCase(payment.getStatus())) {
            throw new ConflictException(
                    "Trạng thái Payment hiện tại không cho phép thanh toán VNPay"
            );
        }
        if (payment.getAmount() == null
                || payment.getAmount().compareTo(amount) != 0) {
            throw new ConflictException(
                    "Số tiền Payment không khớp với số tiền của đơn hàng"
            );
        }
        if ("FAILED".equalsIgnoreCase(payment.getStatus())) {
            payment.setStatus("PENDING");
            payment.setPaidAt(null);
            paymentRepository.save(payment);
        }
    }

    private boolean hasUnresolvedAttempt(List<PaymentTransactionAttempt> attempts) {
        return attempts.stream().anyMatch(attempt -> {
            String status = attempt.getStatus();
            return !"FAILED".equalsIgnoreCase(status)
                    && !"EXPIRED".equalsIgnoreCase(status);
        });
    }
}
