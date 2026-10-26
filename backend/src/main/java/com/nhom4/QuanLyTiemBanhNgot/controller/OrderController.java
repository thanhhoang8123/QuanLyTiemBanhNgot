package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderPromotionSuggestionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.PosOrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.PosOrderQuoteResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
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
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
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
    public List<OrderResponse> getAllOrders() {
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
    public OrderResponse getOrderById(@PathVariable Long id) {
        return orderService.findById(id);
    }

    @PostMapping("/quote")
    public OrderQuoteResponse quoteOrder(@Valid @RequestBody OrderQuoteRequest request) {
        return orderService.quote(request);
    }

    @PostMapping("/promotion-suggestions")
    public List<OrderPromotionSuggestionResponse> getPromotionSuggestions(
            @Valid @RequestBody OrderQuoteRequest request) {
        return orderService.promotionSuggestions(request);
    }

    @PostMapping("/pos-quote")
    public PosOrderQuoteResponse quotePosOrder(
            @Valid @RequestBody PosOrderQuoteRequest request) {
        return orderService.quotePos(request);
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
    public OrderResponse createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        return orderService.createForAuthenticatedEmployee(request, authentication.getName());
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancelOrder(@PathVariable Long id) {
        return orderService.cancel(id);
    }

    @PostMapping("/{id}/deliver")
    public OrderResponse markOrderDelivered(@PathVariable Long id) {
        return orderService.markDelivered(id);
    }

    @PostMapping("/{id}/complete")
    public OrderResponse completeOrder(@PathVariable Long id) {
        return orderService.complete(id);
    }

    /**
     * PUT /api/orders/{id}
     *
     * Cập nhật đơn hàng.
     *
     * Chỉ cập nhật địa chỉ giao hàng.
     */
    @PutMapping("/{id}")
    public OrderResponse updateOrder(
            @PathVariable Long id,
            @RequestBody OrderUpdateRequest request) {
        return orderService.updateOrder(id, request);
    }

    /**
     * DELETE /api/orders/{id}
     *
     * Xóa đơn hàng theo ID.
     */
    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
    }
}