package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CustomerOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerOrderService;
import com.nhom4.QuanLyTiemBanhNgot.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/orders")
@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','MANAGER','STAFF')")
public class CustomerOrderController {
    private final CustomerOrderService customerOrderService;
    private final OrderService orderService;

    public CustomerOrderController(CustomerOrderService customerOrderService, OrderService orderService) {
        this.customerOrderService = customerOrderService;
        this.orderService = orderService;
    }

    @PostMapping("/quote")
    public OrderQuoteResponse quote(@Valid @RequestBody OrderQuoteRequest request) {
        return orderService.quoteCustomer(request);
    }

    @PostMapping
    public OrderResponse create(
            Authentication authentication,
            @RequestHeader("Idempotency-Key")
            @Pattern(
                    regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    message = "Idempotency-Key không hợp lệ"
            ) String idempotencyKey,
            @Valid @RequestBody CustomerOrderRequest request) {
        return customerOrderService.create(authentication.getName(), request, idempotencyKey);
    }

    @GetMapping
    public List<OrderResponse> findAll(Authentication authentication) {
        return customerOrderService.findAll(authentication.getName());
    }

    @GetMapping("/by-request-key/{key}")
    public OrderResponse findByRequestKey(
            Authentication authentication,
            @PathVariable String key) {
        return customerOrderService.findByRequestKey(authentication.getName(), key);
    }

    @GetMapping("/{id}")
    public OrderResponse findById(Authentication authentication, @PathVariable Long id) {
        return customerOrderService.findById(authentication.getName(), id);
    }
}
