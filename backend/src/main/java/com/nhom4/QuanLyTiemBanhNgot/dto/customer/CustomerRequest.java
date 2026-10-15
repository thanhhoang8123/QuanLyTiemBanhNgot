package com.nhom4.QuanLyTiemBanhNgot.dto.customer;

public record CustomerRequest(
        String fullName,
        String phone,
        String email,
        String address
) {
}
