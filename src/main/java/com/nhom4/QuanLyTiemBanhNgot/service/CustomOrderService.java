package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.CustomOrder;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomOrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service xử lý đơn bánh đặt theo yêu cầu riêng.
 */
@Service
public class CustomOrderService {

    private final CustomOrderRepository customOrderRepository;

    /**
     * Constructor Injection.
     */
    public CustomOrderService(
            CustomOrderRepository customOrderRepository) {

        this.customOrderRepository = customOrderRepository;
    }

    /**
     * Lấy tất cả đơn đặt bánh riêng.
     */
    public List<CustomOrder> findAll() {
        return customOrderRepository.findAll();
    }

    /**
     * Tìm đơn đặt bánh theo ID.
     */
    public CustomOrder findById(Long id) {
        return customOrderRepository.findById(id)
                .orElse(null);
    }

    /**
     * Thêm hoặc cập nhật đơn đặt bánh.
     */
    public CustomOrder save(CustomOrder customOrder) {
        return customOrderRepository.save(customOrder);
    }

    /**
     * Xóa đơn đặt bánh.
     */
    public void deleteById(Long id) {
        customOrderRepository.deleteById(id);
    }
}