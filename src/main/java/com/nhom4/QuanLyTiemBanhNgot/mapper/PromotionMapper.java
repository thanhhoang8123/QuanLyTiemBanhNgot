package com.nhom4.QuanLyTiemBanhNgot.mapper;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.CreatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.PromotionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.UpdatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class PromotionMapper {

    public Promotion toEntity(CreatePromotionRequest request) {
        Promotion promotion = new Promotion();
        copyFields(
                request.promotionCode(),
                request.name(),
                request.discountPercent(),
                request.maxDiscount(),
                request.minOrderValue(),
                request.startDate(),
                request.endDate(),
                request.status(),
                promotion
        );
        return promotion;
    }

    public void updateEntity(UpdatePromotionRequest request, Promotion promotion) {
        copyFields(
                request.promotionCode(),
                request.name(),
                request.discountPercent(),
                request.maxDiscount(),
                request.minOrderValue(),
                request.startDate(),
                request.endDate(),
                request.status(),
                promotion
        );
    }

    public PromotionResponse toResponse(Promotion promotion) {
        return new PromotionResponse(
                promotion.getId(),
                promotion.getPromotionCode(),
                promotion.getName(),
                promotion.getDiscountPercent(),
                promotion.getMaxDiscount(),
                promotion.getMinOrderValue(),
                promotion.getStartDate(),
                promotion.getEndDate(),
                promotion.getStatus()
        );
    }

    private void copyFields(
            String promotionCode,
            String name,
            BigDecimal discountPercent,
            BigDecimal maxDiscount,
            BigDecimal minOrderValue,
            LocalDate startDate,
            LocalDate endDate,
            Boolean status,
            Promotion promotion) {
        promotion.setPromotionCode(promotionCode.trim());
        promotion.setName(name.trim());
        promotion.setDiscountPercent(discountPercent);
        promotion.setMaxDiscount(maxDiscount);
        promotion.setMinOrderValue(minOrderValue);
        promotion.setStartDate(startDate);
        promotion.setEndDate(endDate);
        promotion.setStatus(status);
    }
}
