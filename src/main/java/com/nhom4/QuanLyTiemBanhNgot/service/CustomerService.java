package com.nhom4.QuanLyTiemBanhNgot.service;


import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service xử lý logic liên quan đến Customer.
 *
 * Luồng:
 *
 * Controller
 * ↓
 * CustomerService
 * ↓
 * CustomerRepository
 * ↓
 * Database
 *

 */
@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    /**
     * Constructor Injection.
     *
     * Spring sẽ tự động inject CustomerRepository
     * vào Service.
     */
    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * Lấy danh sách tất cả khách hàng.
     */
    public List<Customer> findAll() {
        return customerRepository.findAll();
    }

    /**
     * Tìm khách hàng theo ID.
     *
     * Nếu không tìm thấy thì trả về null.
     *
     * Lưu ý:
     * Cách này đơn giản, phù hợp giai đoạn CRUD cơ bản.
     * Sau này có thể xử lý 404 bằng ResponseEntity/Exception.
     */
    public Customer findById(Long id) {
        return customerRepository.findById(id).orElse(null);
    }

    /**
     * Thêm mới hoặc cập nhật khách hàng.
     *
     * save():
     * - ID chưa tồn tại → INSERT
     * - ID đã tồn tại → UPDATE
     */
    public Customer save(Customer customer) {
        return customerRepository.save(customer);
    }

    /**
     * Xóa khách hàng theo ID.
     */
    public void deleteById(Long id) {
        customerRepository.deleteById(id);
    }
}