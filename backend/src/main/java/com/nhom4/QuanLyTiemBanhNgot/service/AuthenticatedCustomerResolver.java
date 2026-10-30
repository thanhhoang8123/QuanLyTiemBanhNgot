package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthenticatedCustomerResolver {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;

    public AuthenticatedCustomerResolver(
            AccountRepository accountRepository,
            CustomerRepository customerRepository) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public Customer requireActiveCustomer(String username) {
        if (!StringUtils.hasText(username)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn chưa đăng nhập"
            );
        }

        Account account = accountRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tài khoản đăng nhập không còn hợp lệ"
                ));

        Customer customer = account.getCustomer();
        if (customer != null && customer.getId() != null && Boolean.TRUE.equals(customer.getStatus())) {
            return customer;
        }

        // Nếu tài khoản có email, thử tìm khách hàng theo email
        if (StringUtils.hasText(account.getEmail())) {
            Customer existing = customerRepository.findByEmail(account.getEmail().trim()).orElse(null);
            if (existing != null && Boolean.TRUE.equals(existing.getStatus())) {
                account.setCustomer(existing);
                accountRepository.save(account);
                return existing;
            }
        }

        // Tự động khởi tạo hồ sơ khách hàng liên kết với tài khoản này để mua hàng / kiểm thử thuận tiện
        Customer newCustomer = new Customer();
        newCustomer.setFullName(StringUtils.hasText(account.getUsername()) ? account.getUsername() : "Khách hàng");
        newCustomer.setEmail(StringUtils.hasText(account.getEmail()) ? account.getEmail() : (account.getUsername() + "@bakery.local"));
        newCustomer.setPhone("0900000000");
        newCustomer.setAddress("Cửa hàng WA Patisserie Bakery");
        newCustomer.setLoyaltyPoints(0);
        newCustomer.setStatus(true);
        Customer savedCustomer = customerRepository.save(newCustomer);

        account.setCustomer(savedCustomer);
        accountRepository.save(account);
        return savedCustomer;
    }
}
