package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CustomerOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class CustomerOrderService {
    private static final Pattern CUSTOMER_REQUEST_KEY_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );

    private final AuthenticatedCustomerResolver customerResolver;
    private final OrderService orderService;

    public CustomerOrderService(
            AuthenticatedCustomerResolver customerResolver,
            OrderService orderService) {
        this.customerResolver = customerResolver;
        this.orderService = orderService;
    }

    @Transactional
    public OrderResponse create(String username, CustomerOrderRequest request, String idempotencyKey) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        OrderResponse order = orderService.createCustomerOrder(customer, request, idempotencyKey);
        if (request.phone() != null && !request.phone().isBlank()) {
            customer.setPhone(request.phone());
        }
        return order;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll(String username) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        return orderService.findByCustomerId(customer.getId());
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(String username, Long orderId) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        return orderService.findByIdAndCustomerId(orderId, customer.getId());
    }

    @Transactional(readOnly = true)
    public OrderResponse findByRequestKey(String username, String requestKey) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        if (requestKey == null || !CUSTOMER_REQUEST_KEY_PATTERN.matcher(requestKey).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key không hợp lệ");
        }
        return orderService.findByCustomerIdAndRequestKey(customer.getId(), requestKey);
    }

}
