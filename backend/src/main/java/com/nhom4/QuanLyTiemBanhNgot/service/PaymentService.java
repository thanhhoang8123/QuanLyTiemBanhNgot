package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.PaymentResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Payment;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PaymentMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
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

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentMapper paymentMapper;

    /**
     * Constructor Injection.
     */
    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            PaymentMapper paymentMapper) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.paymentMapper = paymentMapper;
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
            if ("PENDING".equals(order.getStatus())) {
                order.setStatus("CONFIRMED");
                orderRepository.save(order);
            }
        } else {
            payment.setStatus("FAILED");
            payment.setPaidAt(null);
        }

        return paymentMapper.toResponse(paymentRepository.save(payment));
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
    public void deleteById(Long id) {
        Payment payment = findPaymentById(id);
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            throw new ConflictException(
                    "Không thể xóa Payment đã thanh toán thành công"
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