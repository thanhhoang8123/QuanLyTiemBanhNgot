package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.PromotionProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho liên kết promotion_products.
 */
@RestController
@RequestMapping("/api/promotion-products")
public class PromotionProductController {

    private final PromotionProductService promotionProductService;

    public PromotionProductController(PromotionProductService promotionProductService) {
        this.promotionProductService = promotionProductService;
    }

    @GetMapping
    public ResponseEntity<List<PromotionProductResponse>> getAll() {
        return ResponseEntity.ok(promotionProductService.findAll());
    }

    @GetMapping("/{promotionId}/{productId}")
    public ResponseEntity<PromotionProductResponse> getById(
            @PathVariable Long promotionId,
            @PathVariable Long productId) {
        return ResponseEntity.ok(
                promotionProductService.findByIds(promotionId, productId)
        );
    }

    @PostMapping
    public ResponseEntity<PromotionProductResponse> create(
            @Valid @RequestBody PromotionProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(promotionProductService.create(request));
    }

    @DeleteMapping("/{promotionId}/{productId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long promotionId,
            @PathVariable Long productId) {
        promotionProductService.deleteByIds(promotionId, productId);
        return ResponseEntity.noContent().build();
    }
}
