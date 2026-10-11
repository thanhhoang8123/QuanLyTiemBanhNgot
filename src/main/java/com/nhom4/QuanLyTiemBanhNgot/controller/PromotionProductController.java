package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProductId;
import com.nhom4.QuanLyTiemBanhNgot.service.PromotionProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý REST API cho bảng promotion_products.
 */
@RestController
@RequestMapping("/api/promotion-products")
public class PromotionProductController {

    private final PromotionProductService promotionProductService;

    /**
     * Constructor Injection.
     */
    public PromotionProductController(
            PromotionProductService promotionProductService) {

        this.promotionProductService = promotionProductService;
    }

    /**
     * GET /api/promotion-products
     *
     * Lấy tất cả quan hệ giữa promotion và product.
     */
    @GetMapping
    public List<PromotionProduct> getAll() {
        return promotionProductService.findAll();
    }

    /**
     * GET /api/promotion-products/{promotionId}/{productId}
     *
     * Ví dụ:
     * /api/promotion-products/1/5
     *
     * Tìm promotion_id = 1
     * và product_id = 5.
     */
    @GetMapping("/{promotionId}/{productId}")
    public PromotionProduct getById(
            @PathVariable Long promotionId,
            @PathVariable Long productId) {

        PromotionProductId id = new PromotionProductId(promotionId, productId);

        return promotionProductService.findById(id);
    }

    /**
     * POST /api/promotion-products
     *
     * Thêm một sản phẩm vào chương trình khuyến mãi.
     */
    @PostMapping
    public PromotionProduct create(
            @RequestBody PromotionProduct promotionProduct) {

        return promotionProductService.save(promotionProduct);
    }

    /**
     * DELETE /api/promotion-products/{promotionId}/{productId}
     *
     * Xóa một sản phẩm khỏi chương trình khuyến mãi.
     */
    @DeleteMapping("/{promotionId}/{productId}")
    public void delete(
            @PathVariable Long promotionId,
            @PathVariable Long productId) {

        PromotionProductId id = new PromotionProductId(promotionId, productId);

        promotionProductService.deleteById(id);
    }
}