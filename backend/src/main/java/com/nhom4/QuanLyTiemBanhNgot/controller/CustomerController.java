package com.nhom4.QuanLyTiemBanhNgot.controller;


import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý API liên quan đến Customer.
 *
 * Base URL:
 * /api/customers
 */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    /**
     * GET /api/customers
     *
     * Lấy toàn bộ khách hàng.
     */
    @GetMapping
    public List<CustomerResponse> getAllCustomers() {
        return customerService.findAll();
    }

    /**
     * GET /api/customers/search?keyword=...
     *
     * Tìm theo tên hoặc số điện thoại.
     */
    @GetMapping("/search")
    public List<CustomerResponse> searchCustomers(
            @RequestParam(required = false) String keyword) {
        return customerService.search(keyword);
    }

    /**
     * GET /api/customers/{id}
     *
     * Lấy một khách hàng theo ID.
     */
    @GetMapping("/{id}")
    public CustomerResponse getCustomerById(@PathVariable Long id) {
        return customerService.findById(id);
    }

    /**
     * POST /api/customers
     *
     * Thêm khách hàng mới.
     *
     * Nhận thông tin hồ sơ khách hàng qua request DTO.
     */
    @PostMapping
    public CustomerResponse createCustomer(@Valid @RequestBody CustomerRequest request) {
        return customerService.create(request);
    }

    /**
     * PUT /api/customers/{id}
     *
     * Cập nhật khách hàng.
     *
     * ID trên URL được dùng làm ID chính thức của bản ghi.
     */
    @PutMapping("/{id}")
    public CustomerResponse updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return customerService.update(id, request);
    }

    /**
     * DELETE /api/customers/{id}
     *
     * Xóa khách hàng theo ID.
     */
    @DeleteMapping("/{id}")
    public void deleteCustomer(@PathVariable Long id) {
        customerService.deleteById(id);
    }
}