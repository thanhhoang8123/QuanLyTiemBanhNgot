package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class OrderConfirmationEmailService {
    private static final Logger LOGGER = LoggerFactory.getLogger(OrderConfirmationEmailService.class);
    private static final DateTimeFormatter ORDER_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("vi-VN"));

    private final AfterCommitEmailSender afterCommitEmailSender;

    public OrderConfirmationEmailService(AfterCommitEmailSender afterCommitEmailSender) {
        this.afterCommitEmailSender = afterCommitEmailSender;
    }

    public void sendOrderConfirmation(Order order, List<OrderItem> orderItems) {
        if (order == null || order.getCustomer() == null) {
            return;
        }
        String recipientEmail = order.getCustomer().getEmail();
        if (!isValidEmail(recipientEmail)) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmail.trim());
            message.setSubject("WA PÂTISSERIE - Xác nhận đơn hàng " + order.getOrderCode());
            message.setText(buildMessage(order, orderItems));
            afterCommitEmailSender.sendAfterCommit(message);
            LOGGER.info("Đã lên lịch gửi email xác nhận nền không chặn (non-blocking) cho đơn hàng {}", order.getOrderCode());
        } catch (Exception ex) {
            LOGGER.warn("Không thể lên lịch gửi email xác nhận cho đơn hàng {}: {}", order.getOrderCode(), ex.getMessage());
        }
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }

        try {
            InternetAddress address = new InternetAddress(email.trim(), true);
            address.validate();
            return email.trim().equals(address.getAddress());
        } catch (AddressException exception) {
            return false;
        }
    }

    private String buildMessage(Order order, List<OrderItem> orderItems) {
        StringBuilder text = new StringBuilder()
                .append("Đơn hàng ")
                .append(order.getOrderCode())
                .append(" đã được tiếp nhận thành công.\n")
                .append("Ngày đặt: ")
                .append(order.getOrderDate().format(ORDER_DATE_FORMAT))
                .append("\n\nSản phẩm:\n");

        for (OrderItem item : orderItems) {
            text.append("- ")
                    .append(item.getProduct().getName())
                    .append(" x ")
                    .append(item.getQuantity())
                    .append("\n");
        }

        if (order.getDeliveryAddress() != null && !order.getDeliveryAddress().isBlank()) {
            text.append("\nĐịa chỉ nhận hàng: ")
                    .append(order.getDeliveryAddress())
                    .append("\n");
        }

        NumberFormat amountFormat = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"));
        amountFormat.setMaximumFractionDigits(2);
        text.append("\nTổng tiền cần thanh toán: ")
                .append(amountFormat.format(order.getTotalAmount().subtract(order.getDiscountAmount())))
                .append(" VND\n")
                .append("Email này xác nhận đơn đã được tiếp nhận, không phải xác nhận thanh toán.");

        return text.toString();
    }
}
