
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AccountRepository accountRepository;

    private final PasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public Account login(String username, String password) {

        if (username == null || username.isBlank()
                || password == null || password.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập tên đăng nhập và mật khẩu"
            );
        }

        Account account = accountRepository
                .findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tên đăng nhập hoặc mật khẩu không đúng"
                ));

        if (!passwordEncoder.matches(
                password, account.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tên đăng nhập hoặc mật khẩu không đúng"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản không hoạt động"
            );
        }

        return account;
    }
}
