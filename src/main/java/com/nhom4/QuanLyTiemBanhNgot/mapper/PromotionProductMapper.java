package com.nhom4.QuanLyTiemBanhNgot.mapper;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import org.springframework.stereotype.Component;

@Component
public class PromotionProductMapper {

    public PromotionProductResponse toResponse(PromotionProduct promotionProduct) {
        return new PromotionProductResponse(
                promotionProduct.getPromotion().getId(),
                promotionProduct.getProduct().getId()
        );
    }
}
