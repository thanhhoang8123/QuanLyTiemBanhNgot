package com.nhom4.QuanLyTiemBanhNgot.dto.customer;

public record CustomerResponse(
        Long id,
        String fullName,
        String phone,
        String email,
        String address,
        Integer loyaltyPoints,
        Boolean status
) {
}
