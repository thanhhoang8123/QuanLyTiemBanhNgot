package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CustomerOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Role;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CustomerOrderServiceTest {
    private AccountRepository accountRepository;
    private OrderService orderService;
    private CustomerOrderService service;
    private Customer customer;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        orderService = mock(OrderService.class);
        service = new CustomerOrderService(accountRepository, orderService);

        customer = new Customer();
        customer.setId(42L);
        customer.setStatus(true);

        Role role = new Role();
        role.setRoleCode("CUSTOMER");
        Account account = new Account();
        account.setUsername("shopper");
        account.setRole(role);
        account.setCustomer(customer);
        account.setStatus("ACTIVE");
        account.setEmailVerified(true);
        when(accountRepository.findByUsername("shopper")).thenReturn(Optional.of(account));
    }

    @Test
    void createsOrderForCustomerResolvedFromAuthenticatedUsername() {
        CustomerOrderRequest request = new CustomerOrderRequest(null, List.of(), null, null);
        OrderResponse expected = mock(OrderResponse.class);
        when(orderService.createCustomerOrder(customer, request, "request-key"))
                .thenReturn(expected);

        OrderResponse actual = service.create("shopper", request, "request-key");

        assertEquals(expected, actual);
        verify(orderService).createCustomerOrder(customer, request, "request-key");
    }

    @Test
    void refusesUnverifiedCustomerBeforeCallingOrderService() {
        Account account = account();
        account.setEmailVerified(false);
        when(accountRepository.findByUsername("shopper")).thenReturn(Optional.of(account));

        assertThrows(ResponseStatusException.class, () -> service.findAll("shopper"));

        verifyNoInteractions(orderService);
    }

    @Test
    void delegatesListAndDetailsUsingOnlyResolvedCustomerId() {
        OrderResponse expected = mock(OrderResponse.class);
        when(orderService.findByCustomerId(42L)).thenReturn(List.of(expected));
        when(orderService.findByIdAndCustomerId(9L, 42L)).thenReturn(expected);
        when(orderService.findByCustomerIdAndRequestKey(
                42L, "a25edbd5-501f-4972-a1d4-70da11372e8c"))
                .thenReturn(expected);

        assertEquals(List.of(expected), service.findAll("shopper"));
        assertEquals(expected, service.findById("shopper", 9L));
        assertEquals(expected, service.findByRequestKey(
                "shopper", "a25edbd5-501f-4972-a1d4-70da11372e8c"));

        verify(orderService).findByCustomerId(42L);
        verify(orderService).findByIdAndCustomerId(9L, 42L);
        verify(orderService).findByCustomerIdAndRequestKey(
                42L, "a25edbd5-501f-4972-a1d4-70da11372e8c");
    }

    @Test
    void rejectsMalformedRequestKeyBeforeLookingUpOrder() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.findByRequestKey("shopper", "not-a-uuid")
        );

        assertEquals(400, exception.getStatusCode().value());
        verifyNoInteractions(orderService);
    }

    @Test
    void rejectsUnauthenticatedLookupBeforeLookingUpOrder() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.findByRequestKey(null, "a25edbd5-501f-4972-a1d4-70da11372e8c")
        );

        assertEquals(401, exception.getStatusCode().value());
        verifyNoInteractions(orderService);
    }

    @Test
    void rejectsNonCustomerLookupBeforeLookingUpOrder() {
        Account account = account();
        account.getRole().setRoleCode("STAFF");
        when(accountRepository.findByUsername("shopper")).thenReturn(Optional.of(account));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.findByRequestKey("shopper", "a25edbd5-501f-4972-a1d4-70da11372e8c")
        );

        assertEquals(403, exception.getStatusCode().value());
        verifyNoInteractions(orderService);
    }

    private Account account() {
        Role role = new Role();
        role.setRoleCode("CUSTOMER");
        Account account = new Account();
        account.setUsername("shopper");
        account.setRole(role);
        account.setCustomer(customer);
        account.setStatus("ACTIVE");
        account.setEmailVerified(true);
        return account;
    }
}
