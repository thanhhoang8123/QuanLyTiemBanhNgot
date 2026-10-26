package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthenticatedCustomerResolver {

    private final AccountRepository accountRepository;

    public AuthenticatedCustomerResolver(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

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
        if (account.getRole() == null
                || !"CUSTOMER".equalsIgnoreCase(account.getRole().getRoleCode())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Chỉ khách hàng mới được sử dụng chức năng này"
            );
        }
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())
                || !Boolean.TRUE.equals(account.getEmailVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản chưa đủ điều kiện đặt hàng"
            );
        }

        Customer customer = account.getCustomer();
        if (customer == null
                || customer.getId() == null
                || !Boolean.TRUE.equals(customer.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Hồ sơ khách hàng không hoạt động"
            );
        }
        return customer;
    }
}
