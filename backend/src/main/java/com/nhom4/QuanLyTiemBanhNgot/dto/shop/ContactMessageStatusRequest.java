package com.nhom4.QuanLyTiemBanhNgot.dto.shop;

import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessageStatus;
import jakarta.validation.constraints.NotNull;

public record ContactMessageStatusRequest(
        @NotNull(message = "Vui lòng chọn trạng thái")
        ContactMessageStatus status
) {
}
