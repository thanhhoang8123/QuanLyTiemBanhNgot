package com.nhom4.QuanLyTiemBanhNgot.service;


import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.mapper.CustomerMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomOrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

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
    private final AccountRepository accountRepository;
    private final OrderRepository orderRepository;
    private final CustomOrderRepository customOrderRepository;
    private final CustomerMapper customerMapper;

    /**
     * Constructor Injection.
     *
     * Spring sẽ tự động inject CustomerRepository
     * vào Service.
     */
    public CustomerService(
            CustomerRepository customerRepository,
            AccountRepository accountRepository,
            OrderRepository orderRepository,
            CustomOrderRepository customOrderRepository,
            CustomerMapper customerMapper) {
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.orderRepository = orderRepository;
        this.customOrderRepository = customOrderRepository;
        this.customerMapper = customerMapper;
    }

    /**
     * Lấy danh sách tất cả khách hàng.
     */
    public List<CustomerResponse> findAll() {
        return customerRepository.findAll()
                .stream()
                .map(customerMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> findPage(
            int page, int size, String keyword, String sort, String direction) {
        Pageable pageable = PaginationSupport.pageRequest(
                page, size, sort, direction, "fullName",
                Set.of("id", "fullName", "phone", "email", "loyaltyPoints", "status"));
        String value = keyword == null || keyword.isBlank() ? null : keyword.trim();
        return customerRepository.findPageByKeyword(value, pageable)
                .map(customerMapper::toResponse);
    }

    /**
     * Tìm khách hàng theo tên hoặc số điện thoại; kết quả luôn được chuyển thành DTO.
     */
    public List<CustomerResponse> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        String trimmedKeyword = keyword.trim();
        return customerRepository
                .findByFullNameContainingIgnoreCaseOrPhoneContaining(
                        trimmedKeyword,
                        trimmedKeyword
                )
                .stream()
                .map(customerMapper::toResponse)
                .toList();
    }

    /**
     * Tìm khách hàng theo ID.
     */
    public CustomerResponse findById(Long id) {
        return customerMapper.toResponse(findCustomerById(id));
    }

    /**
     * Tạo khách hàng từ hồ sơ request; Mapper khởi tạo điểm và trạng thái mặc định.
     */
    public CustomerResponse create(CustomerRequest request) {
        Customer customer = customerMapper.toEntity(request);
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    /**
     * Cập nhật hồ sơ nhưng giữ nguyên ID, điểm tích lũy và trạng thái hiện có.
     */
    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findCustomerById(id);
        customerMapper.updateEntity(request, customer);
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    /**
     * Xóa khách hàng theo ID.
     */
    @Transactional
    public void deleteById(Long id) {
        Customer customer = findCustomerById(id);
        if (orderRepository.existsByCustomer_Id(id)
                || customOrderRepository.existsByCustomer_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa khách hàng đang có đơn hàng hoặc đơn đặt bánh riêng"
            );
        }
        if (accountRepository.existsByCustomer_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa hồ sơ khách hàng đang liên kết với tài khoản đăng nhập"
            );
        }

        customerRepository.delete(customer);
    }

    private Customer findCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Không tìm thấy khách hàng với ID: " + id
        ));
    }
}