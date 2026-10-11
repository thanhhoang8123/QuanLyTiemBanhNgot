package com.nhom4.QuanLyTiemBanhNgot.dto;

import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String username,
        Long roleId,
        String roleName,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}