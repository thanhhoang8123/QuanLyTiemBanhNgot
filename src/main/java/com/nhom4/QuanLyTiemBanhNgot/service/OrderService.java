package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service xử lý các thao tác liên quan đến Order.
 *
 * Luồng xử lý:
 *
 * Controller
 * ↓
 * OrderService
 * ↓
 * OrderRepository
 * ↓
 * Database
 */
@Service
public class OrderService {

    /**
     * Repository dùng để truy cập bảng orders.
     */
    private final OrderRepository orderRepository;

    /**
     * Constructor Injection.
     *
     * Spring tự động truyền OrderRepository
     * vào OrderService.
     */
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Lấy tất cả đơn hàng.
     *
     * findAll() được JpaRepository cung cấp sẵn.
     */
    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    /**
     * Tìm đơn hàng theo ID.
     *
     * Nếu không tìm thấy thì trả về null.
     */
    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElse(null);
    }

    /**
     * Thêm mới hoặc cập nhật đơn hàng.
     *
     * Nếu Order chưa có ID:
     * INSERT
     *
     * Nếu Order đã có ID:
     * UPDATE
     */
    public Order save(Order order) {
        return orderRepository.save(order);
    }

    /**
     * Xóa đơn hàng theo ID.
     */
    public void deleteById(Long id) {
        orderRepository.deleteById(id);
    }
}