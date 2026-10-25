package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CustomerOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class CustomerOrderService {
    private static final Pattern CUSTOMER_REQUEST_KEY_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );

    private final AccountRepository accountRepository;
    private final OrderService orderService;

    public CustomerOrderService(AccountRepository accountRepository, OrderService orderService) {
        this.accountRepository = accountRepository;
        this.orderService = orderService;
    }

    @Transactional
    public OrderResponse create(String username, CustomerOrderRequest request, String idempotencyKey) {
        Customer customer = resolveCustomer(username);
        return orderService.createCustomerOrder(customer, request, idempotencyKey);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll(String username) {
        Customer customer = resolveCustomer(username);
        return orderService.findByCustomerId(customer.getId());
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(String username, Long orderId) {
        Customer customer = resolveCustomer(username);
        return orderService.findByIdAndCustomerId(orderId, customer.getId());
    }

    @Transactional(readOnly = true)
    public OrderResponse findByRequestKey(String username, String requestKey) {
        Customer customer = resolveCustomer(username);
        if (requestKey == null || !CUSTOMER_REQUEST_KEY_PATTERN.matcher(requestKey).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key không hợp lệ");
        }
        return orderService.findByCustomerIdAndRequestKey(customer.getId(), requestKey);
    }

    private Customer resolveCustomer(String username) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập");
        }

        Account account = accountRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tài khoản đăng nhập không còn hợp lệ"
                ));
        if (account.getRole() == null
                || !"CUSTOMER".equalsIgnoreCase(account.getRole().getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ khách hàng mới được sử dụng chức năng này");
        }
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())
                || !Boolean.TRUE.equals(account.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa đủ điều kiện đặt hàng");
        }

        Customer customer = account.getCustomer();
        if (customer == null || customer.getId() == null || !Boolean.TRUE.equals(customer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hồ sơ khách hàng không hoạt động");
        }
        return customer;
    }
}
