package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.CustomOrder;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomOrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho bảng custom_orders.
 *
 * Đường dẫn:
 * /api/custom-orders
 */
@RestController
@RequestMapping("/api/custom-orders")
public class CustomOrderController {

    private final CustomOrderService customOrderService;

    /**
     * Constructor Injection.
     */
    public CustomOrderController(
            CustomOrderService customOrderService) {

        this.customOrderService = customOrderService;
    }

    /**
     * GET /api/custom-orders
     *
     * Lấy tất cả đơn bánh đặt riêng.
     */
    @GetMapping
    public List<CustomOrder> getAllCustomOrders() {
        return customOrderService.findAll();
    }

    /**
     * GET /api/custom-orders/{id}
     *
     * Lấy một đơn đặt bánh.
     */
    @GetMapping("/{id}")
    public CustomOrder getCustomOrderById(
            @PathVariable Long id) {

        return customOrderService.findById(id);
    }

    /**
     * POST /api/custom-orders
     *
     * Tạo đơn đặt bánh riêng.
     */
    @PostMapping
    public CustomOrder createCustomOrder(
            @RequestBody CustomOrder customOrder) {

        return customOrderService.save(customOrder);
    }

    /**
     * PUT /api/custom-orders/{id}
     *
     * Cập nhật đơn đặt bánh.
     */
    @PutMapping("/{id}")
    public CustomOrder updateCustomOrder(
            @PathVariable Long id,
            @RequestBody CustomOrder customOrder) {

        customOrder.setId(id);

        return customOrderService.save(customOrder);
    }

    /**
     * DELETE /api/custom-orders/{id}
     *
     * Xóa đơn đặt bánh.
     */
    @DeleteMapping("/{id}")
    public void deleteCustomOrder(
            @PathVariable Long id) {

        customOrderService.deleteById(id);
    }
}