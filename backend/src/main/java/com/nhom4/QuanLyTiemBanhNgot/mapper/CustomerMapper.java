package com.nhom4.QuanLyTiemBanhNgot.mapper;

import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Customer toEntity(CustomerRequest request) {
        Customer customer = new Customer();
        // Khách hàng mới bắt đầu với 0 điểm và ở trạng thái hoạt động.
        customer.setLoyaltyPoints(0);
        customer.setStatus(true);
        copyProfileFields(request, customer);
        return customer;
    }

    public void updateEntity(CustomerRequest request, Customer customer) {
        // Chỉ cập nhật thông tin hồ sơ; giữ nguyên id, điểm tích lũy và trạng thái.
        copyProfileFields(request, customer);
    }

    public CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getAddress(),
                customer.getLoyaltyPoints(),
                customer.getStatus()
        );
    }

    private void copyProfileFields(CustomerRequest request, Customer customer) {
        customer.setFullName(request.fullName());
        customer.setPhone(request.phone());
        customer.setEmail(request.email());
        customer.setAddress(request.address());
    }
}
