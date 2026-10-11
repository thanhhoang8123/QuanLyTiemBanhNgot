package com.nhom4.QuanLyTiemBanhNgot.controller;



import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.service.PromotionService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    // Constructor Injection
    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    // =========================
    // GET /api/promotions
    // Lấy danh sách tất cả khuyến mãi
    // =========================
    @GetMapping
    public List<Promotion> getAllPromotions() {
        return promotionService.findAll();
    }

    // =========================
    // GET /api/promotions/{id}
    // Lấy một khuyến mãi theo ID
    // =========================
    @GetMapping("/{id}")
    public Promotion getPromotionById(@PathVariable Long id) {
        return promotionService.findById(id);
    }

    // =========================
    // POST /api/promotions
    // Thêm khuyến mãi
    // =========================
    @PostMapping
    public Promotion createPromotion(@RequestBody Promotion promotion) {
        return promotionService.save(promotion);
    }

    // =========================
    // PUT /api/promotions/{id}
    // Cập nhật khuyến mãi
    // =========================
    @PutMapping("/{id}")
    public Promotion updatePromotion(
            @PathVariable Long id,
            @RequestBody Promotion promotion) {

        // Đảm bảo cập nhật đúng bản ghi có ID trên URL
        promotion.setId(id);

        return promotionService.save(promotion);
    }

    // =========================
    // DELETE /api/promotions/{id}
    // Xóa khuyến mãi
    // =========================
    @DeleteMapping("/{id}")
    public void deletePromotion(@PathVariable Long id) {
        promotionService.deleteById(id);
    }
}
