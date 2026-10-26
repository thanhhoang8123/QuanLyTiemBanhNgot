package com.nhom4.QuanLyTiemBanhNgot.dto.employee;

import java.math.BigDecimal;

public record EmployeeListResponse(
        Long id,
        String fullName,
        String phone,
        String email,
        BigDecimal salary,
        Boolean status
) {
}
