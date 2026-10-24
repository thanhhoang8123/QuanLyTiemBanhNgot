package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.account.CreateAccountRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.account.UpdateAccountRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Role;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.RoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountService(
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Account> getAll() {
        return accountRepository.findAll();
    }

    public Optional<Account> getById(Long id) {
        return accountRepository.findById(id);
    }

    @Transactional
    public Account create(CreateAccountRequest request) {
        String username = request.username().trim();
        if (accountRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại");
        }

        Account account = new Account();
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        Role role = findRole(request.roleId());
        if ("CUSTOMER".equalsIgnoreCase(role.getRoleCode())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tài khoản khách hàng phải được tạo qua luồng đăng ký");
        }
        account.setRole(role);
        account.setStatus(request.status() == null ? "ACTIVE" : request.status());
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    @Transactional
    public Account update(Long id, UpdateAccountRequest request, String actingUsername) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        preventSelfManagement(account, actingUsername);

        String username = request.username().trim();
        if (accountRepository.existsByUsernameAndIdNot(username, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại");
        }

        Role role = findRole(request.roleId());
        if (account.getRole() != null
                && "CUSTOMER".equalsIgnoreCase(account.getRole().getRoleCode())
                && !account.getRole().getId().equals(role.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể thay đổi vai trò của tài khoản khách hàng");
        }
        String newStatus = request.status() == null ? account.getStatus() : request.status();
        if ("CUSTOMER".equalsIgnoreCase(role.getRoleCode())
                && "ACTIVE".equalsIgnoreCase(newStatus)
                && !Boolean.TRUE.equals(account.getEmailVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể kích hoạt tài khoản khách hàng chưa xác minh email");
        }

        account.setUsername(username);
        account.setRole(role);
        account.setStatus(newStatus);
        if (request.password() != null && !request.password().isBlank()) {
            account.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        account.setUpdatedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    private Role findRole(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Vai trò tài khoản không hợp lệ"));
    }

    @Transactional
    public void delete(Long id, String actingUsername) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản"
                ));
        preventSelfManagement(account, actingUsername);

        accountRepository.delete(account);
    }

    private void preventSelfManagement(Account account, String actingUsername) {
        if (account.getUsername().equalsIgnoreCase(actingUsername)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể thay đổi hoặc xóa tài khoản đang đăng nhập");
        }
    }
}
