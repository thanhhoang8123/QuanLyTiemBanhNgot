package com.nhom4.QuanLyTiemBanhNgot.dto.shop;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ContactRequest(
        @NotBlank(message = "Vui lòng nhập họ tên")
        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
        String name,

        @NotBlank(message = "Vui lòng nhập email")
        @Email(message = "Email không hợp lệ")
        @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
        String email,

        @NotBlank(message = "Vui lòng nhập chủ đề")
        @Size(max = 120, message = "Chủ đề không được vượt quá 120 ký tự")
        @Pattern(regexp = "^[^\\r\\n]*$", message = "Chủ đề không hợp lệ")
        String subject,

        @NotBlank(message = "Vui lòng nhập nội dung")
        @Size(max = 3000, message = "Nội dung không được vượt quá 3000 ký tự")
        String message
) {
}
