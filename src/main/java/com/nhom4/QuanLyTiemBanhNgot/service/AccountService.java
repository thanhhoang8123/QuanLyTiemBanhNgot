package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.RoleRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AccountService(
            AccountRepository accountRepository,
            RoleRepository roleRepository) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
    }

    public List<Account> getAll() {
        return accountRepository.findAll();
    }

    public Optional<Account> getById(Long id) {
        return accountRepository.findById(id);
    }

    @Transactional
    public Account save(Account account) {
        if (account == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu tài khoản không được để trống"
            );
        }

        if (account.getUsername() == null
                || account.getUsername().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên đăng nhập không được để trống"
            );
        }

        String username = account.getUsername().trim();
        boolean isUpdate = account.getId() != null;

        Account existing = null;

        if (isUpdate) {
            existing = accountRepository.findById(account.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Không tìm thấy tài khoản"
                    ));

            if (accountRepository.existsByUsernameAndIdNot(
                    username, account.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tên đăng nhập đã tồn tại"
                );
            }
        } else {
            if (accountRepository.existsByUsername(username)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tên đăng nhập đã tồn tại"
                );
            }
        }

        if (!isUpdate && (account.getPasswordHash() == null
                || account.getPasswordHash().isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu không được để trống"
            );
        }

        if (account.getRole() == null
                || account.getRole().getId() == null
                || !roleRepository.existsById(account.getRole().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vai trò tài khoản không hợp lệ"
            );
        }

        if (isUpdate) {
            existing.setUsername(username);

            existing.setRole(
                    roleRepository.findById(account.getRole().getId())
                            .orElseThrow()
            );

            existing.setStatus(account.getStatus());

            // Chỉ mã hóa và thay đổi nếu nhập mật khẩu mới.
            if (account.getPasswordHash() != null
                    && !account.getPasswordHash().isBlank()) {
                existing.setPasswordHash(
                        passwordEncoder.encode(account.getPasswordHash())
                );
            }

            existing.setUpdatedAt(LocalDateTime.now());

            return accountRepository.save(existing);
        }

        account.setId(null);
        account.setUsername(username);

        account.setRole(
                roleRepository.findById(account.getRole().getId())
                        .orElseThrow()
        );

        // Mã hóa mật khẩu trước khi lưu vào database.
        account.setPasswordHash(
                passwordEncoder.encode(account.getPasswordHash())
        );

        if (account.getStatus() == null
                || account.getStatus().isBlank()) {
            account.setStatus("ACTIVE");
        }

        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());

        return accountRepository.save(account);
    }

    @Transactional
    public void delete(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản"
                ));

        accountRepository.delete(account);
    }
}