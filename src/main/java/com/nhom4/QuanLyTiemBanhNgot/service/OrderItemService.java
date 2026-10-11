package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service xử lý chi tiết đơn hàng.
 */
@Service
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;

    /**
     * Constructor Injection.
     */
    public OrderItemService(OrderItemRepository orderItemRepository) {
        this.orderItemRepository = orderItemRepository;
    }

    /**
     * Lấy tất cả chi tiết đơn hàng.
     */
    public List<OrderItem> findAll() {
        return orderItemRepository.findAll();
    }

    /**
     * Tìm chi tiết đơn hàng theo ID.
     */
    public OrderItem findById(Long id) {
        return orderItemRepository.findById(id)
                .orElse(null);
    }

    /**
     * Thêm mới hoặc cập nhật OrderItem.
     */
    public OrderItem save(OrderItem orderItem) {
        return orderItemRepository.save(orderItem);
    }

    /**
     * Xóa OrderItem.
     */
    public void deleteById(Long id) {
        orderItemRepository.deleteById(id);
    }
}