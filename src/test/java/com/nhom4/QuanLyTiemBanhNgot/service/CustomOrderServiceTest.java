package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CreateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CustomOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.UpdateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.UpdateCustomOrderStatusRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.CustomOrder;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.CustomOrderMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomOrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomOrderServiceTest {

    @Mock
    private CustomOrderRepository customOrderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    private CustomOrderService customOrderService;
    private long nextOrderId = 100L;

    @BeforeEach
    void setUp() {
        customOrderService = new CustomOrderService(
                customOrderRepository,
                customerRepository,
                employeeRepository,
                new CustomOrderMapper()
        );
    }

    @Test
    void createStoresBackendTimestampAndPendingStatus() {
        stubActiveReferences();
        when(customOrderRepository.save(any(CustomOrder.class)))
                .thenAnswer(invocation -> {
                    CustomOrder order = invocation.getArgument(0);
                    order.setId(23L);
                    return order;
                });

        CustomOrderResponse response = customOrderService.create(validCreateRequest());

        ArgumentCaptor<CustomOrder> captor = ArgumentCaptor.forClass(CustomOrder.class);
        verify(customOrderRepository).save(captor.capture());
        CustomOrder saved = captor.getValue();
        assertEquals("PENDING", saved.getStatus());
        assertNotNull(saved.getOrderDate());
        assertEquals(23L, response.id());
        assertEquals(1L, response.customerId());
        assertEquals(2L, response.employeeId());
        assertEquals("Birthday cake", response.cakeName());
    }

    @Test
    void createReturnsNotFoundForMissingCustomer() {
        when(customerRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> customOrderService.create(validCreateRequest())
        );
        verify(customOrderRepository, never()).save(any(CustomOrder.class));
    }

    @Test
    void createReturnsNotFoundForMissingEmployee() {
        Customer customer = activeCustomer();
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(employeeRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> customOrderService.create(validCreateRequest())
        );
        verify(customOrderRepository, never()).save(any(CustomOrder.class));
    }

    @Test
    void createRejectsInactiveCustomerOrEmployee() {
        Customer customer = activeCustomer();
        customer.setStatus(false);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));

        assertThrows(
                ConflictException.class,
                () -> customOrderService.create(validCreateRequest())
        );
        verify(employeeRepository, never()).findById(2L);
    }

    @Test
    void createRejectsInactiveEmployee() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(activeCustomer()));
        Employee employee = activeEmployee();
        employee.setStatus(false);
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(employee));

        assertThrows(
                ConflictException.class,
                () -> customOrderService.create(validCreateRequest())
        );
        verify(customOrderRepository, never()).save(any(CustomOrder.class));
    }

    @Test
    void createRejectsInvalidPricesAndDeposit() {
        CreateCustomOrderRequest badEstimate = new CreateCustomOrderRequest(
                1L, 2L, "Cake", null, LocalDateTime.now().plusDays(1),
                BigDecimal.ZERO, BigDecimal.ZERO
        );
        CreateCustomOrderRequest badDeposit = new CreateCustomOrderRequest(
                1L, 2L, "Cake", null, LocalDateTime.now().plusDays(1),
                new BigDecimal("100.00"), new BigDecimal("100.01")
        );

        assertThrows(BadRequestException.class, () -> customOrderService.create(badEstimate));
        assertThrows(BadRequestException.class, () -> customOrderService.create(badDeposit));
        verify(customOrderRepository, never()).save(any(CustomOrder.class));
    }

    @Test
    void createRejectsDeliveryDateThatIsNotInFuture() {
        CreateCustomOrderRequest request = new CreateCustomOrderRequest(
                1L, 2L, "Cake", null,
                LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1),
                new BigDecimal("100.00"), BigDecimal.ZERO
        );

        assertThrows(BadRequestException.class, () -> customOrderService.create(request));
        verify(customerRepository, never()).findById(1L);
    }

    @Test
    void updateReturnsNotFoundWhenCustomOrderDoesNotExist() {
        when(customOrderRepository.findByIdForUpdate(50L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> customOrderService.update(50L, validUpdateRequest())
        );
    }

    @Test
    void completedOrCancelledOrderCannotBeUpdated() {
        for (String status : new String[]{"COMPLETED", "CANCELLED"}) {
            CustomOrder order = existingOrder(status);
            when(customOrderRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(order));

            assertThrows(
                    ConflictException.class,
                    () -> customOrderService.update(50L, validUpdateRequest())
            );
        }
        verify(customOrderRepository, never()).save(any(CustomOrder.class));
    }

    @Test
    void statusTransitionFollowsApprovedWorkflow() {
        CustomOrder order = existingOrder("PENDING");
        when(customOrderRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(order));
        when(customOrderRepository.save(order)).thenReturn(order);

        CustomOrderResponse response = customOrderService.updateStatus(
                50L,
                new UpdateCustomOrderStatusRequest("CONFIRMED")
        );

        assertEquals("CONFIRMED", response.status());
    }

    @Test
    void cancellationAndCompletionFollowApprovedWorkflow() {
        assertAllowedTransition("PENDING", "CANCELLED");
        assertAllowedTransition("CONFIRMED", "IN_PROGRESS");
        assertAllowedTransition("CONFIRMED", "CANCELLED");
        assertAllowedTransition("IN_PROGRESS", "COMPLETED");
    }

    @Test
    void disallowedTransitionAndUnknownStatusAreRejected() {
        CustomOrder order = existingOrder("PENDING");
        when(customOrderRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(order));

        assertThrows(
                ConflictException.class,
                () -> customOrderService.updateStatus(
                        50L, new UpdateCustomOrderStatusRequest("IN_PROGRESS")
                )
        );
        assertThrows(
                BadRequestException.class,
                () -> customOrderService.updateStatus(
                        50L, new UpdateCustomOrderStatusRequest("PAID")
                )
        );
        verify(customOrderRepository, never()).save(any(CustomOrder.class));
    }

    @Test
    void onlyPendingCustomOrderCanBeDeleted() {
        CustomOrder pending = existingOrder("PENDING");
        when(customOrderRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(pending));
        customOrderService.deleteById(50L);
        verify(customOrderRepository).delete(pending);

        CustomOrder confirmed = existingOrder("CONFIRMED");
        when(customOrderRepository.findByIdForUpdate(51L)).thenReturn(Optional.of(confirmed));
        assertThrows(ConflictException.class, () -> customOrderService.deleteById(51L));
        verify(customOrderRepository, never()).delete(confirmed);

        CustomOrder cancelled = existingOrder("CANCELLED");
        when(customOrderRepository.findByIdForUpdate(52L)).thenReturn(Optional.of(cancelled));
        assertThrows(ConflictException.class, () -> customOrderService.deleteById(52L));
        verify(customOrderRepository, never()).delete(cancelled);
    }

    @Test
    void deleteReturnsNotFoundWhenCustomOrderDoesNotExist() {
        when(customOrderRepository.findByIdForUpdate(404L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> customOrderService.deleteById(404L)
        );
    }

    private void stubActiveReferences() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(activeCustomer()));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(activeEmployee()));
    }

    private Customer activeCustomer() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setStatus(true);
        return customer;
    }

    private Employee activeEmployee() {
        Employee employee = new Employee();
        employee.setId(2L);
        employee.setStatus(true);
        return employee;
    }

    private CreateCustomOrderRequest validCreateRequest() {
        return new CreateCustomOrderRequest(
                1L, 2L, "Birthday cake", "Blue icing",
                LocalDateTime.now().plusDays(2),
                new BigDecimal("500.00"), new BigDecimal("100.00")
        );
    }

    private UpdateCustomOrderRequest validUpdateRequest() {
        return new UpdateCustomOrderRequest(
                1L, 2L, "Updated cake", null,
                LocalDateTime.now().plusDays(3),
                new BigDecimal("600.00"), new BigDecimal("100.00")
        );
    }

    private CustomOrder existingOrder(String status) {
        CustomOrder order = new CustomOrder();
        order.setId(50L);
        order.setCustomer(activeCustomer());
        order.setEmployee(activeEmployee());
        order.setCakeName("Cake");
        order.setOrderDate(LocalDateTime.now().minusDays(1));
        order.setDeliveryDate(LocalDateTime.now().plusDays(1));
        order.setEstimatedPrice(new BigDecimal("100.00"));
        order.setDeposit(BigDecimal.ZERO);
        order.setStatus(status);
        return order;
    }

    private void assertAllowedTransition(String currentStatus, String targetStatus) {
        long id = ++nextOrderId;
        CustomOrder order = existingOrder(currentStatus);
        order.setId(id);
        when(customOrderRepository.findByIdForUpdate(id)).thenReturn(Optional.of(order));
        when(customOrderRepository.save(order)).thenReturn(order);

        CustomOrderResponse response = customOrderService.updateStatus(
                id,
                new UpdateCustomOrderStatusRequest(targetStatus)
        );

        assertEquals(targetStatus, response.status());
    }
}
