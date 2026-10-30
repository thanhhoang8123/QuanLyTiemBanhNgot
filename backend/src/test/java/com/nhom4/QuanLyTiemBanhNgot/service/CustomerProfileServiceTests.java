package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.customer.CustomerProfileRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerProfileServiceTests {
    @Test
    void updateProfileChangesOnlyEditableCustomerFields() {
        AuthenticatedCustomerResolver resolver = mock(AuthenticatedCustomerResolver.class);
        Customer customer = new Customer();
        customer.setFullName("Tên cũ");
        customer.setEmail("customer@example.com");
        customer.setLoyaltyPoints(12);
        customer.setStatus(true);
        when(resolver.requireActiveCustomer("buyer")).thenReturn(customer);
        CustomerProfileService service = new CustomerProfileService(resolver);

        var response = service.updateProfile(
                "buyer",
                new CustomerProfileRequest("  Tên mới  ", "0901234567", "  Địa chỉ mới  "));

        assertEquals("Tên mới", customer.getFullName());
        assertEquals("0901234567", customer.getPhone());
        assertEquals("Địa chỉ mới", customer.getAddress());
        assertEquals("customer@example.com", customer.getEmail());
        assertEquals(12, customer.getLoyaltyPoints());
        assertEquals(true, customer.getStatus());
        assertEquals("customer@example.com", response.email());
        assertEquals(12, response.loyaltyPoints());
        verify(resolver).requireActiveCustomer("buyer");
    }
}
