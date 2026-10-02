package com.nhom4.QuanLyTiemBanhNgot.controller;


import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerService;
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
    public List<Customer> getAllCustomers() {
        return customerService.findAll();
    }

    /**
     * GET /api/customers/{id}
     *
     * Lấy một khách hàng theo ID.
     */
    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Long id) {
        return customerService.findById(id);
    }

    /**
     * POST /api/customers
     *
     * Thêm khách hàng mới.
     *
     * Dữ liệu Customer được gửi trong request body dạng JSON.
     */
    @PostMapping
    public Customer createCustomer(@RequestBody Customer customer) {
        return customerService.save(customer);
    }

    /**
     * PUT /api/customers/{id}
     *
     * Cập nhật khách hàng.
     *
     * ID trên URL được dùng làm ID chính thức của bản ghi.
     */
    @PutMapping("/{id}")
    public Customer updateCustomer(
            @PathVariable Long id,
            @RequestBody Customer customer) {
        // Đảm bảo dữ liệu gửi lên được cập nhật đúng bản ghi.
        customer.setId(id);

        return customerService.save(customer);
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