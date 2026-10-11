package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý API cho bảng orders.
 *
 * Đường dẫn gốc:
 * /api/orders
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    /**
     * Service xử lý nghiệp vụ đơn hàng.
     */
    private final OrderService orderService;

    /**
     * Constructor Injection.
     */
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * GET /api/orders
     *
     * Lấy danh sách tất cả đơn hàng.
     */
    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.findAll();
    }

    /**
     * GET /api/orders/{id}
     *
     * Lấy một đơn hàng theo ID.
     *
     * Ví dụ:
     * GET /api/orders/1
     *
     * @PathVariable lấy số 1 từ URL.
     */
    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Long id) {
        return orderService.findById(id);
    }

    /**
     * POST /api/orders
     *
     * Tạo một đơn hàng mới.
     *
     * @RequestBody:
     *               Chuyển JSON từ request thành đối tượng Order.
     */
    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        return orderService.save(order);
    }

    /**
     * PUT /api/orders/{id}
     *
     * Cập nhật đơn hàng.
     *
     * ID lấy từ URL sẽ được gán cho object Order.
     */
    @PutMapping("/{id}")
    public Order updateOrder(
            @PathVariable Long id,
            @RequestBody Order order) {

        // Đảm bảo cập nhật đúng ID được truyền trên URL.
        order.setId(id);

        return orderService.save(order);
    }

    /**
     * DELETE /api/orders/{id}
     *
     * Xóa đơn hàng theo ID.
     */
    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderService.deleteById(id);
    }
}