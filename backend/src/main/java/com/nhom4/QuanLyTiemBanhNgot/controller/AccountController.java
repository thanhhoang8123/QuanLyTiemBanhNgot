package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.AccountResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.account.CreateAccountRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.account.UpdateAccountRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    private AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getUsername(),
                account.getRole() != null ? account.getRole().getId() : null,
                account.getRole() != null ? account.getRole().getName() : null,
                account.getRole() != null ? account.getRole().getRoleCode() : null,
                account.getStatus(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }

    @GetMapping
    public List<AccountResponse> getAll() {
        return accountService.getAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getById(@PathVariable Long id) {
        return accountService.getById(id)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AccountResponse> create(
            @Valid @RequestBody CreateAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(accountService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(
                toResponse(accountService.update(id, request, currentUser.getUsername())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        if (accountService.getById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        accountService.delete(id, currentUser.getUsername());
        return ResponseEntity.noContent().build();
    }
}