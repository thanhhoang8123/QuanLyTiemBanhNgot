package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.PaymentResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PaymentMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Service xử lý thông tin thanh toán.
 */
@Service
public class PaymentService {

    private static final String WALK_IN_CUSTOMER_EMAIL = "pos.walkin@example.invalid";
    private static final BigDecimal AMOUNT_PER_LOYALTY_POINT = new BigDecimal("10000");
    private static final BigDecimal DISCOUNT_PER_REDEEMED_POINT = new BigDecimal("1000.00");

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionAttemptRepository paymentTransactionAttemptRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final PaymentMapper paymentMapper;
    private final OrderStatusHistoryService orderStatusHistoryService;

    /**
     * Constructor Injection.
     */
    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            PaymentTransactionAttemptRepository paymentTransactionAttemptRepository,
            CustomerRepository customerRepository,
            PaymentMapper paymentMapper,
            OrderStatusHistoryService orderStatusHistoryService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.paymentTransactionAttemptRepository = paymentTransactionAttemptRepository;
        this.customerRepository = customerRepository;
        this.paymentMapper = paymentMapper;
        this.orderStatusHistoryService = orderStatusHistoryService;
    }

    /**
     * Lấy tất cả thanh toán.
     */
    public List<PaymentResponse> findAll() {
        return paymentRepository.findAll()
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    /**
     * Tìm thanh toán theo ID.
     */
    public PaymentResponse findById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thanh toán với ID: " + id
                ));
        return paymentMapper.toResponse(payment);
    }

    /**
     * Lưu Payment theo cách dùng nội bộ hiện có.
     */
    public Payment save(Payment payment) {
        return paymentRepository.save(payment);
    }

    void completeVnPayPayment(Payment payment, Order order, String transactionNo) {
        payment.setStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now(ZoneOffset.UTC));
        payment.setTransactionId(transactionNo);
        paymentRepository.save(payment);
        settleLoyaltyPoints(order, payment.getAmount());
        if ("PENDING".equals(order.getStatus())) {
            String oldStatus = order.getStatus();
            order.setStatus("CONFIRMED");
            orderRepository.save(order);
            orderStatusHistoryService.recordStatusChangeAfterCommit(
                    order.getId(), oldStatus, order.getStatus(), "Thanh toán VNPay thành công");
        }
    }

    /**
     * Tạo Payment chỉ với thông tin client được phép cung cấp.
     * Số tiền và trạng thái khởi tạo được thiết lập ở backend từ dữ liệu Order.
     */
    @Transactional
    public PaymentResponse create(CreatePaymentRequest request) {
        Order order = orderRepository.findByIdForUpdate(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng với ID: " + request.orderId()
                ));
        if ("CANCELLED".equals(order.getStatus())
                || "COMPLETED".equals(order.getStatus())) {
            throw new ConflictException(
                    "Không thể tạo thanh toán cho đơn hàng đã hủy hoặc hoàn tất"
            );
        }
        if (paymentRepository.existsByOrder_Id(request.orderId())) {
            throw new ConflictException(
                    "Đơn hàng này đã có thông tin thanh toán"
            );
        }
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
        BigDecimal paymentAmount = totalAmount.subtract(discountAmount);
        if (paymentAmount.signum() <= 0) {
            throw new ConflictException(
                    "Số tiền thanh toán phải lớn hơn 0"
            );
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setAmount(paymentAmount);
        payment.setStatus("PENDING");
        payment.setPaidAt(null);
        try {
            // Flush tại đây để bắt xung đột UNIQUE ngay trong transaction này.
            return paymentMapper.toResponse(paymentRepository.saveAndFlush(payment));
        } catch (DataIntegrityViolationException exception) {
            // UNIQUE(order_id) là lớp bảo vệ cuối cùng khi hai request chạy đồng thời.
            throw new ConflictException(
                    "Xung đột dữ liệu khi tạo thanh toán; vui lòng kiểm tra lại đơn hàng"
            );
        }
    }

    /**
     * Mô phỏng kết quả thanh toán và đồng bộ Order trong cùng transaction.
     */
    @Transactional
    public PaymentResponse simulate(Long id, SimulatePaymentRequest request) {
        if (request == null
                || (!"SUCCESS".equals(request.result())
                && !"FAILED".equals(request.result()))) {
            throw new BadRequestException(
                    "Kết quả mô phỏng phải là SUCCESS hoặc FAILED"
            );
        }
        Payment existingPayment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thanh toán với ID: " + id
                ));
        Long orderId = existingPayment.getOrder().getId();
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng của thanh toán với ID: " + id
                ));
        Payment payment = paymentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thanh toán với ID: " + id
                ));

        if ("VNPAY".equalsIgnoreCase(payment.getPaymentMethod())) {
            throw new ConflictException(
                    "Không thể mô phỏng kết quả cho giao dịch VNPay"
            );
        }
        if ("SUCCESS".equals(payment.getStatus())) {
            throw new ConflictException(
                    "Payment đã thành công và không thể xử lý lại"
            );
        }
        if (!"PENDING".equals(payment.getStatus())
                && !"FAILED".equals(payment.getStatus())) {
            throw new ConflictException(
                    "Trạng thái Payment hiện tại không cho phép mô phỏng"
            );
        }
        if ("CANCELLED".equals(order.getStatus())
                || "COMPLETED".equals(order.getStatus())) {
            throw new ConflictException(
                    "Không thể thanh toán đơn hàng đã hủy hoặc hoàn tất"
            );
        }

        if ("SUCCESS".equals(request.result())) {
            payment.setStatus("SUCCESS");
            payment.setPaidAt(LocalDateTime.now(ZoneOffset.UTC));
            settleLoyaltyPoints(order, payment.getAmount());
            if ("PENDING".equals(order.getStatus())) {
                String oldStatus = order.getStatus();
                order.setStatus("CONFIRMED");
                orderRepository.save(order);
                orderStatusHistoryService.recordStatusChangeAfterCommit(
                        order.getId(), oldStatus, order.getStatus(), "Thanh toán thành công");
            }
        } else {
            payment.setStatus("FAILED");
            payment.setPaidAt(null);
        }

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    private void settleLoyaltyPoints(Order order, BigDecimal paidAmount) {
        Customer orderCustomer = order.getCustomer();
        int pointsToRedeem = redeemedPoints(order);
        int pointsToAward = pointsToAward(paidAmount);
        if (pointsToRedeem > 0
                && orderCustomer != null
                && WALK_IN_CUSTOMER_EMAIL.equalsIgnoreCase(orderCustomer.getEmail())) {
            throw new ConflictException("Khách vãng lai không thể sử dụng điểm");
        }
        if (orderCustomer == null
                || (pointsToRedeem == 0
                && (WALK_IN_CUSTOMER_EMAIL.equalsIgnoreCase(orderCustomer.getEmail())
                || pointsToAward == 0))) {
            return;
        }

        Customer customer = customerRepository.findByIdForUpdate(orderCustomer.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khách hàng của đơn hàng"
                ));
        int currentPoints = customer.getLoyaltyPoints() == null
                ? 0
                : customer.getLoyaltyPoints();
        if (pointsToRedeem > currentPoints) {
            throw new ConflictException(
                    "Khách hàng không còn đủ điểm để thanh toán đơn này"
            );
        }
        try {
            int updatedPoints = Math.subtractExact(currentPoints, pointsToRedeem);
            if (!WALK_IN_CUSTOMER_EMAIL.equalsIgnoreCase(customer.getEmail())) {
                updatedPoints = Math.addExact(updatedPoints, pointsToAward);
            }
            customer.setLoyaltyPoints(updatedPoints);
        } catch (ArithmeticException exception) {
            throw new ConflictException("Điểm tích lũy của khách hàng đã vượt giới hạn");
        }
        customerRepository.save(customer);
    }

    private int redeemedPoints(Order order) {
        if (order.getPromotion() != null
                || order.getDiscountAmount() == null
                || order.getDiscountAmount().signum() == 0) {
            return 0;
        }
        BigDecimal[] pointAmount = order.getDiscountAmount()
                .divideAndRemainder(DISCOUNT_PER_REDEEMED_POINT);
        if (pointAmount[1].signum() != 0) {
            throw new ConflictException(
                    "Tiền giảm giá đổi điểm của đơn hàng không hợp lệ"
            );
        }
        try {
            return pointAmount[0].intValueExact();
        } catch (ArithmeticException exception) {
            throw new ConflictException("Số điểm đổi của đơn hàng vượt giới hạn");
        }
    }

    private int pointsToAward(BigDecimal paidAmount) {
        if (paidAmount == null || paidAmount.signum() <= 0) return 0;
        try {
            return paidAmount
                    .divideToIntegralValue(AMOUNT_PER_LOYALTY_POINT)
                    .intValueExact();
        } catch (ArithmeticException exception) {
            throw new ConflictException("Số điểm tích lũy của đơn hàng vượt giới hạn");
        }
    }

    /**
     * Kiểm tra ID rồi từ chối cập nhật trực tiếp vì chưa có nghiệp vụ cập nhật Payment.
     */
    public void update(Long id) {
        findPaymentById(id);
        throw new ConflictException(
                "Không hỗ trợ cập nhật Payment trực tiếp"
        );
    }

    /**
     * Chỉ cho phép xóa Payment chưa thành công.
     */
    @Transactional
    public void deleteById(Long id) {
        Payment existingPayment = findPaymentById(id);
        Long orderId = existingPayment.getOrder().getId();
        orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng của thanh toán với ID: " + id
                ));
        Payment payment = paymentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thanh toán với ID: " + id
                ));
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            throw new ConflictException(
                    "Không thể xóa Payment đã thanh toán thành công"
            );
        }
        if (paymentTransactionAttemptRepository.existsByPayment_Id(payment.getId())) {
            throw new ConflictException(
                    "Không thể xóa Payment đã có lịch sử giao dịch"
            );
        }

        paymentRepository.delete(payment);
    }

    private Payment findPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thanh toán với ID: " + id
                ));
    }
}