package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerProfileRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerProfileResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerProfileService {
    private final AuthenticatedCustomerResolver customerResolver;

    public CustomerProfileService(AuthenticatedCustomerResolver customerResolver) {
        this.customerResolver = customerResolver;
    }

    @Transactional(readOnly = true)
    public CustomerProfileResponse getProfile(String username) {
        return toResponse(customerResolver.requireActiveCustomer(username));
    }

    @Transactional
    public CustomerProfileResponse updateProfile(String username, CustomerProfileRequest request) {
        Customer customer = customerResolver.requireActiveCustomer(username);
        customer.setFullName(request.fullName().trim());
        customer.setPhone(normalizeOptional(request.phone()));
        customer.setAddress(normalizeOptional(request.address()));
        return toResponse(customer);
    }

    private CustomerProfileResponse toResponse(Customer customer) {
        return new CustomerProfileResponse(
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getAddress(),
                customer.getLoyaltyPoints());
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
