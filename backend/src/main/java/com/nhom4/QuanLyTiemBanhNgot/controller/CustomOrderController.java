package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CreateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CustomOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.UpdateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.UpdateCustomOrderStatusRequest;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

import java.util.List;

/**
 * REST Controller cho bảng custom_orders.
 */
@RestController
@RequestMapping("/api/custom-orders")
public class CustomOrderController {

    private final CustomOrderService customOrderService;

    public CustomOrderController(CustomOrderService customOrderService) {
        this.customOrderService = customOrderService;
    }

    @GetMapping
    public ResponseEntity<List<CustomOrderResponse>> getAllCustomOrders() {
        return ResponseEntity.ok(customOrderService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomOrderResponse> getCustomOrderById(
            @PathVariable Long id) {
        return ResponseEntity.ok(customOrderService.findById(id));
    }

    // ĐÃ FIX: Cho phép cả Khách hàng (Customer) lẫn Nhân viên gửi yêu cầu đặt bánh riêng vào hệ thống chung
@PostMapping("/customer/create")
    public ResponseEntity<CustomOrderResponse> createByCustomer(
            @RequestBody CreateCustomOrderRequest request,
            Principal principal) {
        // In ra console xem username lúc này là gì và có truyền lên được không
        System.out.println("User đang gọi API đặt bánh: " + (principal != null ? principal.getName() : "null"));
        
        String username = principal.getName();
        CustomOrderResponse response = customOrderService.createForAuthenticatedCustomer(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PutMapping("/{id}")
    public ResponseEntity<CustomOrderResponse> updateCustomOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomOrderRequest request) {
        return ResponseEntity.ok(customOrderService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CustomOrderResponse> updateCustomOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomOrderStatusRequest request) {
        return ResponseEntity.ok(customOrderService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomOrder(@PathVariable Long id) {
        customOrderService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}