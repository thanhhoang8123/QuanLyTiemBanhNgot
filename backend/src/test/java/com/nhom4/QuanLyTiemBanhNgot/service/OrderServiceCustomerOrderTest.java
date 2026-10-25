package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderItemRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.CustomerOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.mapper.OrderMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class OrderServiceCustomerOrderTest {
    private OrderRepository orderRepository;
    private OrderItemRepository orderItemRepository;
    private ProductRepository productRepository;
    private OrderConfirmationEmailService emailService;
    private OrderService service;
    private Customer customer;
    private Product product;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        orderItemRepository = mock(OrderItemRepository.class);
        productRepository = mock(ProductRepository.class);
        emailService = mock(OrderConfirmationEmailService.class);
        service = new OrderService(
                orderRepository,
                orderItemRepository,
                mock(CustomerRepository.class),
                mock(EmployeeRepository.class),
                productRepository,
                mock(PaymentRepository.class),
                mock(PromotionRepository.class),
                mock(PromotionProductRepository.class),
                new OrderMapper(),
                mock(OrderStatusHistoryService.class),
                emailService
        );

        customer = new Customer();
        customer.setId(42L);
        customer.setStatus(true);

        product = new Product();
        product.setId(7L);
        product.setName("Bánh kem");
        product.setPrice(new BigDecimal("125000.00"));
        product.setQuantity(8);
        product.setStatus(true);

        when(orderRepository.findByCustomer_IdAndCustomerRequestKey(42L, "request-key"))
                .thenReturn(Optional.empty());
        when(productRepository.findAllByIdForUpdate(List.of(7L))).thenReturn(List.of(product));
        when(orderRepository.saveAndFlush(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(123L);
            return order;
        });
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderItemRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void calculatesAmountsFromDatabasePriceAndCreatesUnpaidPendingOrderWithoutEmail() {
        CustomerOrderRequest request = new CustomerOrderRequest(
                "10 Bánh Ngọt",
                List.of(new CreateOrderItemRequest(7L, 2)),
                null,
                null
        );

        OrderResponse response = service.createCustomerOrder(customer, request, "request-key");

        assertEquals("DH000123", response.orderCode());
        assertEquals(42L, response.customerId());
        assertNull(response.employeeId());
        assertEquals("PENDING", response.status());
        assertEquals(new BigDecimal("250000.00"), response.totalAmount());
        assertEquals(BigDecimal.ZERO, response.discountAmount());
        assertEquals(new BigDecimal("250000.00"), response.finalAmount());
        assertEquals(1, response.items().size());
        assertEquals(new BigDecimal("125000.00"), response.items().get(0).unitPrice());

        verify(orderRepository).saveAndFlush(any(Order.class));
        verify(orderItemRepository).saveAll(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void reusesExistingOrderForSameIdempotencyKeyAndPayload() {
        Order existingOrder = existingOrder();
        OrderItem existingItem = existingItem();
        when(orderRepository.findByCustomer_IdAndCustomerRequestKey(42L, "request-key"))
                .thenReturn(Optional.of(existingOrder));
        when(orderItemRepository.findByOrder_Id(123L)).thenReturn(List.of(existingItem));

        OrderResponse response = service.createCustomerOrder(
                customer,
                new CustomerOrderRequest("10 Bánh Ngọt", List.of(new CreateOrderItemRequest(7L, 2)), null, null),
                "request-key"
        );

        assertEquals(123L, response.id());
        verify(productRepository, never()).findAllByIdForUpdate(any());
        verify(orderRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsReusingIdempotencyKeyForDifferentPayload() {
        when(orderRepository.findByCustomer_IdAndCustomerRequestKey(42L, "request-key"))
                .thenReturn(Optional.of(existingOrder()));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.createCustomerOrder(
                        customer,
                        new CustomerOrderRequest(null, List.of(new CreateOrderItemRequest(7L, 3)), null, null),
                        "request-key"
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(productRepository, never()).findAllByIdForUpdate(any());
    }

    @Test
    void findsOrderByRequestKeyWithinCustomerScopeWithoutChangingInventory() {
        Order existingOrder = existingOrder();
        when(orderRepository.findByCustomer_IdAndCustomerRequestKey(42L, "request-key"))
                .thenReturn(Optional.of(existingOrder));
        when(orderItemRepository.findByOrder_Id(123L)).thenReturn(List.of(existingItem()));

        OrderResponse response = service.findByCustomerIdAndRequestKey(42L, "request-key");

        assertEquals(123L, response.id());
        assertEquals(42L, response.customerId());
        verify(orderRepository).findByCustomer_IdAndCustomerRequestKey(42L, "request-key");
        verify(productRepository, never()).findAllByIdForUpdate(any());
        verify(orderRepository, never()).saveAndFlush(any());
        verify(orderItemRepository, never()).saveAll(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void doesNotFindRequestKeyOutsideCurrentCustomerScope() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.findByCustomerIdAndRequestKey(99L, "request-key")
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(orderRepository).findByCustomer_IdAndCustomerRequestKey(99L, "request-key");
        verifyNoInteractions(orderItemRepository, productRepository, emailService);
    }

    @Test
    void rejectsUnavailableStockAndInvalidQuantityBeforePersisting() {
        product.setQuantity(1);
        ResponseStatusException stockException = assertThrows(
                ResponseStatusException.class,
                () -> service.createCustomerOrder(
                        customer,
                        new CustomerOrderRequest(null, List.of(new CreateOrderItemRequest(7L, 2)), null, null),
                        "request-key"
                )
        );
        assertEquals(HttpStatus.CONFLICT, stockException.getStatusCode());

        ResponseStatusException quantityException = assertThrows(
                ResponseStatusException.class,
                () -> service.createCustomerOrder(
                        customer,
                        new CustomerOrderRequest(null, List.of(new CreateOrderItemRequest(7L, 0)), null, null),
                        "request-key"
                )
        );
        assertEquals(HttpStatus.BAD_REQUEST, quantityException.getStatusCode());
        verify(orderRepository, never()).saveAndFlush(any());
    }

    private Order existingOrder() {
        Order order = new Order();
        order.setId(123L);
        order.setOrderCode("DH000123");
        order.setCustomer(customer);
        order.setStatus("PENDING");
        order.setTotalAmount(new BigDecimal("250000.00"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setDeliveryAddress("10 Bánh Ngọt");
        order.setCustomerRequestKey("request-key");
        return order;
    }

    private OrderItem existingItem() {
        OrderItem item = new OrderItem();
        item.setOrder(existingOrder());
        item.setProduct(product);
        item.setQuantity(2);
        item.setUnitPrice(new BigDecimal("125000.00"));
        item.setDiscountAmount(BigDecimal.ZERO);
        item.setLineTotal(new BigDecimal("250000.00"));
        return item;
    }
}
