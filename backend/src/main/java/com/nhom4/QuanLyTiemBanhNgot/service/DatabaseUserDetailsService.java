package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final AccountRepository accountRepository;

    public DatabaseUserDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalizedUsername = username == null ? "" : username.trim();
        Account account = accountRepository.findByUsername(normalizedUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Tên đăng nhập không tồn tại."));

        if (account.getRole() == null || account.getRole().getRoleCode() == null
                || account.getRole().getRoleCode().isBlank()) {
            throw new UsernameNotFoundException("Tài khoản chưa được gán vai trò hợp lệ.");
        }
        String roleCode = account.getRole().getRoleCode().trim().toUpperCase(Locale.ROOT);

        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + roleCode)
        );

        boolean enabled = "ACTIVE".equalsIgnoreCase(account.getStatus());
        if ("CUSTOMER".equals(roleCode)) {
            enabled = enabled && Boolean.TRUE.equals(account.getEmailVerified());
        }

        return User.withUsername(account.getUsername())
                .password(account.getPasswordHash())
                .authorities(authorities)
                .accountLocked(!enabled)
                .disabled(!enabled)
                .build();
    }
}
