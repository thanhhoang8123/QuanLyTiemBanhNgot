package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProductId;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service xử lý dữ liệu liên quan đến promotion_products.
 *
 * Luồng:
 *
 * Controller
 * ↓
 * Service
 * ↓
 * Repository
 * ↓
 * Database
 */
@Service
public class PromotionProductService {

    private final PromotionProductRepository promotionProductRepository;

    /**
     * Constructor Injection.
     *
     * Spring tự động truyền Repository
     * vào Service.
     */
    public PromotionProductService(
            PromotionProductRepository promotionProductRepository) {

        this.promotionProductRepository = promotionProductRepository;
    }

    /**
     * Lấy tất cả các liên kết khuyến mãi - sản phẩm.
     */
    public List<PromotionProduct> findAll() {
        return promotionProductRepository.findAll();
    }

    /**
     * Tìm một liên kết bằng khóa chính ghép.
     *
     * Ví dụ:
     * promotionId = 1
     * productId = 5
     */
    public PromotionProduct findById(PromotionProductId id) {
        return promotionProductRepository.findById(id)
                .orElse(null);
    }

    /**
     * Thêm hoặc cập nhật liên kết.
     */
    public PromotionProduct save(PromotionProduct promotionProduct) {
        return promotionProductRepository.save(promotionProduct);
    }

    /**
     * Xóa liên kết bằng khóa chính ghép.
     */
    public void deleteById(PromotionProductId id) {
        promotionProductRepository.deleteById(id);
    }
}