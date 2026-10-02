package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public List<Account> getAll() {
        return accountService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getById(@PathVariable Long id) {
        return accountService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Account create(@RequestBody Account account) {
        return accountService.save(account);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> update(
            @PathVariable Long id,
            @RequestBody Account account) {

        return accountService.getById(id)
                .map(existingAccount -> {
                    existingAccount.setUsername(account.getUsername());
                    existingAccount.setPasswordHash(account.getPasswordHash());
                    existingAccount.setRole(account.getRole());
                    existingAccount.setStatus(account.getStatus());
                    existingAccount.setCreatedAt(account.getCreatedAt());
                    existingAccount.setUpdatedAt(account.getUpdatedAt());

                    return ResponseEntity.ok(
                            accountService.save(existingAccount)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
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