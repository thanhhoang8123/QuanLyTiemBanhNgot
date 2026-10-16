package com.nhom4.QuanLyTiemBanhNgot.dto.promotion;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePromotionRequest(
        @NotBlank(message = "Mã khuyến mãi không được để trống")
        @Size(max = 30, message = "Mã khuyến mãi không được vượt quá 30 ký tự")
        String promotionCode,

        @NotBlank(message = "Tên chương trình không được để trống")
        @Size(max = 100, message = "Tên chương trình không được vượt quá 100 ký tự")
        String name,

        @NotNull(message = "Phần trăm giảm giá không được để trống")
        @Positive(message = "Phần trăm giảm giá phải lớn hơn 0")
        @Max(value = 100, message = "Phần trăm giảm giá không được vượt quá 100")
        @Digits(integer = 3, fraction = 2, message = "Phần trăm giảm giá tối đa 3 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal discountPercent,

        @DecimalMin(value = "0.00", message = "Giảm giá tối đa không được âm")
        @Digits(integer = 13, fraction = 2, message = "Giảm giá tối đa chỉ hỗ trợ 2 chữ số thập phân")
        BigDecimal maxDiscount,

        @DecimalMin(value = "0.00", message = "Giá trị đơn hàng tối thiểu không được âm")
        @Digits(integer = 13, fraction = 2, message = "Giá trị đơn hàng tối thiểu chỉ hỗ trợ 2 chữ số thập phân")
        BigDecimal minOrderValue,

        @NotNull(message = "Ngày bắt đầu không được để trống")
        LocalDate startDate,

        @NotNull(message = "Ngày kết thúc không được để trống")
        LocalDate endDate,

        @NotNull(message = "Trạng thái hoạt động không được để trống")
        Boolean status
) {
}
