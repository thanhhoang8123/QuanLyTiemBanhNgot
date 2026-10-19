package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Role;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.RoleRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class CustomerRegistrationService {
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{4,50}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\s@]+@[^\s@]+\.[^\s@]+$");
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final RoleRepository roleRepository;
    private final EmailVerificationService emailVerificationService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public CustomerRegistrationService(AccountRepository accountRepository,
                                       CustomerRepository customerRepository,
                                       RoleRepository roleRepository,
                                       EmailVerificationService emailVerificationService) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.roleRepository = roleRepository;
        this.emailVerificationService = emailVerificationService;
    }

    @Transactional
    public void register(String username, String password, String fullName, String email, String phone, String address) {
        if (username == null || !USERNAME_PATTERN.matcher(username.trim()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tên đăng nhập phải dài 4-50 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        }
        if (password == null || password.length() < 8 || password.length() > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải dài từ 8 đến 72 ký tự.");
        }
        if (fullName == null || fullName.isBlank() || fullName.trim().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập họ tên hợp lệ.");
        }
        if (email == null || !EMAIL_PATTERN.matcher(email.trim()).matches() || email.trim().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không hợp lệ.");
        }
        String cleanUsername = username.trim();
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        if (accountRepository.existsByUsername(cleanUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng.");
        }
        if (accountRepository.existsByEmailIgnoreCase(cleanEmail) || customerRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng.");
        }

        Role customerRole = roleRepository.findByRoleCodeIgnoreCase("CUSTOMER")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Chưa có vai trò CUSTOMER. Hãy chạy migration cập nhật vai trò."));

        Customer customer = new Customer();
        customer.setFullName(fullName.trim());
        customer.setEmail(cleanEmail);
        customer.setPhone(phone == null || phone.isBlank() ? null : phone.trim());
        customer.setAddress(address == null || address.isBlank() ? null : address.trim());
        customer.setLoyaltyPoints(0);
        customer.setStatus(true);
        customer = customerRepository.save(customer);

        Account account = new Account();
        account.setUsername(cleanUsername);
        account.setPasswordHash(passwordEncoder.encode(password));
        account.setRole(customerRole);
        account.setEmail(cleanEmail);
        account.setEmailVerified(false);
        account.setCustomer(customer);
        account.setStatus("PENDING_VERIFICATION");
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());
        account = accountRepository.save(account);

        // Email gửi thất bại sẽ làm transaction rollback, tránh để lại tài khoản chưa xác minh không có email.
        emailVerificationService.sendVerification(account);
    }
}
