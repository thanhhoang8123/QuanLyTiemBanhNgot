package com.nhom4.QuanLyTiemBanhNgot.dto.customer;

public record CustomerProfileResponse(
        String fullName,
        String phone,
        String email,
        String address,
        Integer loyaltyPoints
) {
}
