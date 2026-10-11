package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.CreatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.PromotionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.UpdatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping
    public ResponseEntity<List<PromotionResponse>> getAllPromotions() {
        return ResponseEntity.ok(promotionService.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<PromotionResponse>> searchPromotions(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(promotionService.search(keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromotionResponse> getPromotionById(
            @PathVariable Long id) {
        return ResponseEntity.ok(promotionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PromotionResponse> createPromotion(
            @Valid @RequestBody CreatePromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(promotionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromotionResponse> updatePromotion(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePromotionRequest request) {
        return ResponseEntity.ok(promotionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id) {
        promotionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
