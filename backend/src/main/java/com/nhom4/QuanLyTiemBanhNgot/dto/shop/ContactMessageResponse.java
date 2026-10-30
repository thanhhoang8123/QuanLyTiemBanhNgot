package com.nhom4.QuanLyTiemBanhNgot.dto.shop;

import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessageStatus;

import java.time.LocalDateTime;

public record ContactMessageResponse(
        Long id,
        Long customerId,
        String name,
        String email,
        String phone,
        String subject,
        String message,
        LocalDateTime createdAt,
        ContactMessageStatus status
) {
    public ContactMessageResponse(
            Long id,
            String name,
            String email,
            String subject,
            String message,
            LocalDateTime createdAt,
            ContactMessageStatus status
    ) {
        this(id, null, name, email, null, subject, message, createdAt, status);
    }
}
