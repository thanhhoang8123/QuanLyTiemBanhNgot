package com.nhom4.QuanLyTiemBanhNgot.dto.shop;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NewsletterSubscriptionRequest(
        @NotBlank(message = "Vui lòng nhập email")
        @Email(message = "Email không hợp lệ")
        @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
        String email,

        @AssertTrue(message = "Bạn cần đồng ý nhận email từ WA Patisserie")
        boolean consent
) {
}
