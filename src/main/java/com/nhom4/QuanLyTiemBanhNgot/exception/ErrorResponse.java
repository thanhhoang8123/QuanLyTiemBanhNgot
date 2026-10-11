package com.nhom4.QuanLyTiemBanhNgot.exception;

import java.time.Instant;

public record ErrorResponse(
        int status,
        String message,
        Instant timestamp
) {
}
