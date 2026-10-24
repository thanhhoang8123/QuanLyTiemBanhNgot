package com.nhom4.QuanLyTiemBanhNgot.dto.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateAccountRequest(
        @NotBlank
        @Size(min = 4, max = 50)
        @Pattern(regexp = "^[A-Za-z0-9._-]+$")
        String username,

        @Size(min = 8, max = 72)
        String password,

        @NotNull
        @Positive
        Long roleId,

        @Pattern(regexp = "ACTIVE|LOCKED|PENDING_VERIFICATION")
        String status
) {
}
