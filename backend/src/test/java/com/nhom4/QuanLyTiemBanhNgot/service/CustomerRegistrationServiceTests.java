package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Role;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerRegistrationServiceTests {
    @Mock private AccountRepository accountRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @Test
    void registersCustomerAsActiveWithoutEmailVerification() {
        Role customerRole = new Role();
        customerRole.setRoleCode("CUSTOMER");
        when(accountRepository.existsByUsername("customer01")).thenReturn(false);
        when(accountRepository.existsByEmailIgnoreCase("customer@example.com")).thenReturn(false);
        when(customerRepository.existsByEmailIgnoreCase("customer@example.com")).thenReturn(false);
        when(roleRepository.findByRoleCodeIgnoreCase("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");

        CustomerRegistrationService service = new CustomerRegistrationService(
                accountRepository, customerRepository, roleRepository, passwordEncoder);
        service.register("customer01", "password123", "Test Customer",
                "Customer@example.com", null, null);

        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository).save(accountCaptor.capture());
        Account registeredAccount = accountCaptor.getValue();
        assertEquals("ACTIVE", registeredAccount.getStatus());
        assertTrue(registeredAccount.getEmailVerified());
        assertEquals("customer@example.com", registeredAccount.getEmail());
        verify(customerRepository).save(any());
    }
}
