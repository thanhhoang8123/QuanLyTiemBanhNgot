package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Role;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {
    @Mock private AccountRepository accountRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @Test
    void activatesLegacyPendingCustomerOnSuccessfulLogin() {
        Role customerRole = new Role();
        customerRole.setRoleCode("CUSTOMER");
        Account account = new Account();
        account.setUsername("customer01");
        account.setPasswordHash("encoded-password");
        account.setRole(customerRole);
        account.setEmailVerified(false);
        account.setStatus("PENDING_VERIFICATION");
        when(accountRepository.findByUsername("customer01")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(accountRepository.save(account)).thenReturn(account);

        AuthService service = new AuthService(accountRepository, passwordEncoder);
        Account loggedInAccount = service.login("customer01", "password123");

        assertEquals("ACTIVE", loggedInAccount.getStatus());
        assertTrue(loggedInAccount.getEmailVerified());
        verify(accountRepository).save(account);
    }
}
