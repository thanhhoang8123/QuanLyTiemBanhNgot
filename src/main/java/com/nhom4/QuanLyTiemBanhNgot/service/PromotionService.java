package com.nhom4.QuanLyTiemBanhNgot.service;



import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class PromotionService {

    private final PromotionRepository promotionRepository;

    // Constructor Injection
    public PromotionService(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    // Lấy tất cả chương trình khuyến mãi
    public List<Promotion> findAll() {
        return promotionRepository.findAll();
    }

    // Tìm khuyến mãi theo ID
    public Promotion findById(Long id) {
        return promotionRepository.findById(id)
                .orElse(null);
    }

    // Thêm hoặc cập nhật khuyến mãi
    public Promotion save(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    // Xóa khuyến mãi theo ID
    public void deleteById(Long id) {
        promotionRepository.deleteById(id);
    }
}