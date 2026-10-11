package com.nhom4.QuanLyTiemBanhNgot.mapper;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderItemRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class OrderMapper {

    public Order toEntity(
            CreateOrderRequest request,
            Customer customer,
            Employee employee) {
        Order order = new Order();
        order.setCustomer(customer);
        order.setEmployee(employee);
        order.setDeliveryAddress(request.deliveryAddress());
        return order;
    }

    public OrderItem toEntity(
            Order order,
            Product product,
            CreateOrderItemRequest request,
            BigDecimal unitPrice,
            BigDecimal discountAmount,
            BigDecimal lineTotal) {
        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setProduct(product);
        orderItem.setQuantity(request.quantity());
        orderItem.setUnitPrice(unitPrice);
        orderItem.setDiscountAmount(discountAmount);
        orderItem.setLineTotal(lineTotal);
        return orderItem;
    }

    public OrderResponse toResponse(
            Order order,
            List<OrderItem> orderItems,
            BigDecimal finalAmount) {
        List<OrderItemResponse> itemResponses = orderItems.stream()
                .map(this::toItemResponse)
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getCustomer().getId(),
                order.getEmployee().getId(),
                order.getOrderDate(),
                order.getDeliveryAddress(),
                order.getDeliveryStatus(),
                order.getTotalAmount(),
                order.getDiscountAmount(),
                finalAmount,
                order.getStatus(),
                order.getCreatedAt(),
                itemResponses
        );
    }

    public OrderItemResponse toItemResponse(OrderItem orderItem) {
        return new OrderItemResponse(
                orderItem.getId(),
                orderItem.getProduct().getId(),
                orderItem.getProduct().getName(),
                orderItem.getQuantity(),
                orderItem.getUnitPrice(),
                orderItem.getDiscountAmount(),
                orderItem.getLineTotal()
        );
    }
}
