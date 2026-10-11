package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.AccountResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.function.Function;

@RestController
@RequestMapping("/api/accounts")
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
    public AccountResponse create(@RequestBody Account account) {
        return toResponse(accountService.save(account));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> update(
            @PathVariable Long id,
            @RequestBody Account account) {

        return accountService.getById(id).map(existingAccount -> {
            existingAccount.setUsername(account.getUsername());

            if (account.getPasswordHash() != null
                    && !account.getPasswordHash().isBlank()) {
                existingAccount.setPasswordHash(account.getPasswordHash());
            }

            existingAccount.setRole(account.getRole());
            existingAccount.setStatus(account.getStatus());

            return ResponseEntity.ok(
                    toResponse(accountService.save(existingAccount))
            );
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (accountService.getById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        accountService.delete(id);
        return ResponseEntity.noContent().build();
    }
}