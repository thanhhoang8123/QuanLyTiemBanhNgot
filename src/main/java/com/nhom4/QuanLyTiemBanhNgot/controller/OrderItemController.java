package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
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

    /**
     * Constructor Injection.
     */
    public OrderItemController(OrderItemService orderItemService) {
        this.orderItemService = orderItemService;
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
     * POST /api/order-items
     *
     * Thêm sản phẩm vào chi tiết đơn hàng.
     */
    @PostMapping
    public OrderItem createOrderItem(
            @RequestBody OrderItem orderItem) {

        return orderItemService.save(orderItem);
    }

    /**
     * PUT /api/order-items/{id}
     *
     * Cập nhật chi tiết đơn hàng.
     */
    @PutMapping("/{id}")
    public OrderItem updateOrderItem(
            @PathVariable Long id,
            @RequestBody OrderItem orderItem) {

        // Lấy ID từ URL làm ID cần cập nhật.
        orderItem.setId(id);

        return orderItemService.save(orderItem);
    }

    /**
     * DELETE /api/order-items/{id}
     *
     * Xóa chi tiết đơn hàng.
     */
    @DeleteMapping("/{id}")
    public void deleteOrderItem(@PathVariable Long id) {
        orderItemService.deleteById(id);
    }
}