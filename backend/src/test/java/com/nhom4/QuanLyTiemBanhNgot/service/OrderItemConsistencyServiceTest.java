package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderItemRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderItemConsistencyServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private PaymentRepository paymentRepository;

    private OrderService orderService;
    private Order order;
    private OrderItem item;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                customerRepository,
                employeeRepository,
                productRepository,
                paymentRepository,
                new OrderMapper()
        );

        order = new Order();
        order.setId(20L);
        order.setTotalAmount(new BigDecimal("999.00"));
        order.setDiscountAmount(new BigDecimal("20.00"));
        order.setOrderCode("DH000020");
        order.setStatus("PENDING");
        order.setDeliveryStatus("PENDING");
        order.setCreatedAt(java.time.LocalDateTime.parse("2026-10-01T09:00:00"));
        order.setOrderDate(java.time.LocalDateTime.parse("2026-10-01T09:00:00"));

        Customer customer = new Customer();
        customer.setId(10L);
        order.setCustomer(customer);
        Employee employee = new Employee();
        employee.setId(11L);
        order.setEmployee(employee);

        item = new OrderItem();
        item.setId(30L);
        item.setOrder(order);
        item.setQuantity(1);
        item.setUnitPrice(new BigDecimal("100.00"));
        item.setDiscountAmount(new BigDecimal("10.00"));
        item.setLineTotal(new BigDecimal("90.00"));

        Product product = new Product();
        product.setId(40L);
        product.setName("Bánh kem");
        item.setProduct(product);
    }

    @Test
    void updateQuantityRecalculatesLineAndOrderTotalsAndKeepsSnapshotPrice() {
        OrderItem otherItem = new OrderItem();
        otherItem.setId(31L);
        otherItem.setOrder(order);
        otherItem.setQuantity(2);
        otherItem.setUnitPrice(new BigDecimal("50.00"));
        otherItem.setDiscountAmount(BigDecimal.ZERO);
        otherItem.setLineTotal(new BigDecimal("100.00"));

        when(orderItemRepository.findById(30L)).thenReturn(Optional.of(item));
        when(orderItemRepository.findByOrder_Id(20L)).thenReturn(List.of(item, otherItem));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderItemRepository.saveAndFlush(any(OrderItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.saveAndFlush(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderItemResponse response = orderService.updateOrderItem(
                30L,
                new OrderItemUpdateRequest(3)
        );

        assertEquals(3, item.getQuantity());
        assertEquals(new BigDecimal("100.00"), item.getUnitPrice());
        assertEquals(new BigDecimal("290.00"), item.getLineTotal());
        assertEquals(new BigDecimal("400.00"), order.getTotalAmount());
        assertEquals(new BigDecimal("100.00"), response.unitPrice());
        assertEquals(new BigDecimal("290.00"), response.lineTotal());
    }

    @Test
    void updateRejectsNullOrNonPositiveQuantityWithoutSaving() {
        for (Integer quantity : List.of(0, -1)) {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> orderService.updateOrderItem(
                            30L,
                            new OrderItemUpdateRequest(quantity)
                    )
            );
            assertEquals(400, exception.getStatusCode().value());
        }

        ResponseStatusException nullQuantityException = assertThrows(
                ResponseStatusException.class,
                () -> orderService.updateOrderItem(30L, new OrderItemUpdateRequest(null))
        );
        assertEquals(400, nullQuantityException.getStatusCode().value());
        verify(orderItemRepository, never()).saveAndFlush(any(OrderItem.class));
    }

    @Test
    void updateReturnsNotFoundForMissingItem() {
        when(orderItemRepository.findById(30L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.updateOrderItem(30L, new OrderItemUpdateRequest(2))
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void deleteRecalculatesOrderTotalFromRemainingItems() {
        OrderItem otherItem = new OrderItem();
        otherItem.setId(31L);
        otherItem.setOrder(order);
        otherItem.setQuantity(2);
        otherItem.setUnitPrice(new BigDecimal("50.00"));
        otherItem.setDiscountAmount(BigDecimal.ZERO);
        otherItem.setLineTotal(new BigDecimal("100.00"));

        when(orderItemRepository.findById(30L)).thenReturn(Optional.of(item));
        when(orderItemRepository.findByOrder_Id(20L))
                .thenReturn(List.of(item, otherItem), List.of(otherItem));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderRepository.saveAndFlush(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(orderItemRepository).delete(item);

        orderService.deleteOrderItem(30L);

        verify(orderItemRepository).delete(item);
        verify(orderItemRepository).flush();
        assertEquals(new BigDecimal("100.00"), order.getTotalAmount());
    }

    @Test
    void deleteRejectsLastItemWithoutChangingOrder() {
        when(orderItemRepository.findById(30L)).thenReturn(Optional.of(item));
        when(orderItemRepository.findByOrder_Id(20L)).thenReturn(List.of(item));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.deleteOrderItem(30L)
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(orderItemRepository, never()).delete(any(OrderItem.class));
        verify(orderRepository, never()).saveAndFlush(any(Order.class));
        assertEquals(new BigDecimal("999.00"), order.getTotalAmount());
    }

    @Test
    void deleteReturnsNotFoundForMissingItem() {
        when(orderItemRepository.findById(30L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.deleteOrderItem(30L)
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void updateRequestOnlyExposesQuantitySoClientCannotSetMoneyFields() {
        String[] requestFields = java.util.Arrays.stream(
                        OrderItemUpdateRequest.class.getRecordComponents())
                .map(component -> component.getName())
                .toArray(String[]::new);

        assertArrayEquals(new String[]{"quantity"}, requestFields);
    }

    @Test
    void updateOrderChangesOnlyDeliveryAddressAndReturnsOrderResponse() {
        Customer originalCustomer = order.getCustomer();
        Employee originalEmployee = order.getEmployee();
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderItemRepository.findByOrder_Id(20L)).thenReturn(List.of(item));

        OrderResponse response = orderService.updateOrder(
                20L,
                new OrderUpdateRequest("  Quận 1, TP.HCM  ")
        );

        assertEquals("  Quận 1, TP.HCM  ", order.getDeliveryAddress());
        assertEquals("DH000020", order.getOrderCode());
        assertSame(originalCustomer, order.getCustomer());
        assertSame(originalEmployee, order.getEmployee());
        assertEquals(new BigDecimal("999.00"), order.getTotalAmount());
        assertEquals(new BigDecimal("20.00"), order.getDiscountAmount());
        assertEquals("PENDING", order.getStatus());
        assertEquals("PENDING", order.getDeliveryStatus());
        assertEquals(java.time.LocalDateTime.parse("2026-10-01T09:00:00"), order.getOrderDate());
        assertEquals(java.time.LocalDateTime.parse("2026-10-01T09:00:00"), order.getCreatedAt());
        assertEquals("  Quận 1, TP.HCM  ", response.deliveryAddress());
        assertEquals(new BigDecimal("979.00"), response.finalAmount());
    }

    @Test
    void updateOrderReturnsNotFoundForMissingOrder() {
        when(orderRepository.findById(20L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.updateOrder(20L, new OrderUpdateRequest("Địa chỉ mới"))
        );

        assertEquals(404, exception.getStatusCode().value());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void deleteOrderReturnsNotFoundForMissingOrder() {
        when(orderRepository.findById(20L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.deleteOrder(20L)
        );

        assertEquals(404, exception.getStatusCode().value());
        verify(orderRepository, never()).delete(any(Order.class));
    }

    @Test
    void deleteOrderRejectsOrderWithItems() {
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrder_Id(20L)).thenReturn(List.of(item));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.deleteOrder(20L)
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(paymentRepository, never()).existsByOrder_Id(20L);
        verify(orderRepository, never()).delete(any(Order.class));
    }

    @Test
    void deleteOrderRejectsOrderWithPayments() {
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrder_Id(20L)).thenReturn(List.of());
        when(paymentRepository.existsByOrder_Id(20L)).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.deleteOrder(20L)
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(orderRepository, never()).delete(any(Order.class));
    }

    @Test
    void deleteOrderRemovesOrderOnlyWhenItHasNoRelatedRecords() {
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrder_Id(20L)).thenReturn(List.of());
        when(paymentRepository.existsByOrder_Id(20L)).thenReturn(false);
        doNothing().when(orderRepository).delete(order);
        doNothing().when(orderRepository).flush();

        orderService.deleteOrder(20L);

        verify(orderRepository).delete(order);
        verify(orderRepository).flush();
    }

    @Test
    void deleteOrderIsTransactionalAndPropagatesDeleteFailure() throws Exception {
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrder_Id(20L)).thenReturn(List.of());
        when(paymentRepository.existsByOrder_Id(20L)).thenReturn(false);
        org.mockito.Mockito.doThrow(new IllegalStateException("delete failed"))
                .when(orderRepository).delete(order);

        assertThrows(
                IllegalStateException.class,
                () -> orderService.deleteOrder(20L)
        );
        assertEquals(true, OrderService.class
                .getMethod("deleteOrder", Long.class)
                .isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class));
        verify(orderRepository, never()).deleteById(20L);
    }

    @Test
    void createCalculatesTotalFromPreDiscountSubtotals() {
        Customer customer = new Customer();
        customer.setId(10L);
        customer.setStatus(true);
        Employee employee = new Employee();
        employee.setId(11L);
        employee.setStatus(true);
        Product product = new Product();
        product.setId(40L);
        product.setName("Bánh kem");
        product.setPrice(new BigDecimal("100.00"));
        product.setStatus(true);

        when(customerRepository.findById(10L)).thenReturn(Optional.of(customer));
        when(employeeRepository.findById(11L)).thenReturn(Optional.of(employee));
        when(productRepository.findAllById(any())).thenReturn(List.of(product));
        when(orderRepository.saveAndFlush(any(Order.class))).thenAnswer(invocation -> {
            Order savedOrder = invocation.getArgument(0);
            savedOrder.setId(21L);
            return savedOrder;
        });
        when(orderRepository.existsByOrderCode("DH000021")).thenReturn(false);
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderItemRepository.saveAll(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.create(new CreateOrderRequest(
                10L,
                11L,
                null,
                List.of(new CreateOrderItemRequest(40L, 2))
        ));

        assertEquals(new BigDecimal("200.00"), response.totalAmount());
        assertEquals(BigDecimal.ZERO, response.discountAmount());
        assertEquals(new BigDecimal("200.00"), response.items().getFirst().lineTotal());
    }

    @Test
    void orderUpdateRequestOnlyContainsDeliveryAddress() {
        String[] requestFields = java.util.Arrays.stream(
                        OrderUpdateRequest.class.getRecordComponents())
                .map(component -> component.getName())
                .toArray(String[]::new);

        assertArrayEquals(new String[]{"deliveryAddress"}, requestFields);
    }
}
