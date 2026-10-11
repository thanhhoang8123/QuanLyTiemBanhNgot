package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.service.OrderService;
import com.nhom4.QuanLyTiemBanhNgot.service.OrderItemService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho bảng order_items.
 *
 * Đường dẫn:
 * /api/order-items
 */
@RestController
@RequestMapping("/api/order-items")
public class OrderItemController {

    private final OrderItemService orderItemService;
    private final OrderService orderService;

    /**
     * Constructor Injection.
     */
    public OrderItemController(
            OrderItemService orderItemService,
            OrderService orderService) {
        this.orderItemService = orderItemService;
        this.orderService = orderService;
    }

    /**
     * GET /api/order-items
     *
     * Lấy tất cả chi tiết đơn hàng.
     */
    @GetMapping
    public List<OrderItem> getAllOrderItems() {
        return orderItemService.findAll();
    }

    /**
     * GET /api/order-items/{id}
     *
     * Lấy một chi tiết đơn hàng.
     */
    @GetMapping("/{id}")
    public OrderItem getOrderItemById(@PathVariable Long id) {
        return orderItemService.findById(id);
    }

    /**
     * PUT /api/order-items/{id}
     *
     * Cập nhật chi tiết đơn hàng.
     */
    @PutMapping("/{id}")
    public OrderItemResponse updateOrderItem(
            @PathVariable Long id,
            @RequestBody OrderItemUpdateRequest request) {
        return orderService.updateOrderItem(id, request);
    }

    /**
     * DELETE /api/order-items/{id}
     *
     * Xóa chi tiết đơn hàng.
     */
    @DeleteMapping("/{id}")
    public void deleteOrderItem(@PathVariable Long id) {
        orderService.deleteOrderItem(id);
    }
}