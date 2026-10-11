
package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.AccountResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AccountResponse> login(
            @RequestBody LoginRequest request) {

        Account account = authService.login(
                request.username(),
                request.password()
        );

        AccountResponse response = new AccountResponse(
                account.getId(),
                account.getUsername(),
                account.getRole().getId(),
                account.getRole().getName(),
                account.getStatus(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }

    public record LoginRequest(
            String username,
            String password
    ) {}
}
