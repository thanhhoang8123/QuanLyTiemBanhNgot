package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderItemRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.CustomerOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderPromotionSuggestionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.PosOrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;
import com.nhom4.QuanLyTiemBanhNgot.mapper.OrderMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServicePromotionTests {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private ProductRepository productRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentTransactionAttemptRepository paymentTransactionAttemptRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private PromotionProductRepository promotionProductRepository;
    @Mock private OrderMapper orderMapper;
    @Mock private OrderStatusHistoryService orderStatusHistoryService;
    @Mock private OrderConfirmationEmailService orderConfirmationEmailService;

    @InjectMocks
    private OrderService orderService;

    private Product product;
    private OrderQuoteRequest request;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(11L);
        product.setName("Bánh thử");
        product.setPrice(new BigDecimal("100000.00"));
        product.setQuantity(10);
        product.setStatus(true);
        request = new OrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 3)),
                null
        );
        lenient().when(productRepository.findAllById(anyCollection()))
                .thenReturn(List.of(product));
    }

    @Test
    void choosesHighestActualDiscountAfterMaximumCaps() {
        Promotion tenPercentCappedAtThirty = promotion(
                1L, "SAVE30", new BigDecimal("10"), new BigDecimal("30000"),
                BigDecimal.ZERO, true, LocalDate.now(ZoneOffset.UTC),
                LocalDate.now(ZoneOffset.UTC));
        Promotion twentyPercentCappedAtTwenty = promotion(
                2L, "SAVE20", new BigDecimal("20"), new BigDecimal("20000"),
                BigDecimal.ZERO, true, LocalDate.now(ZoneOffset.UTC),
                LocalDate.now(ZoneOffset.UTC));
        when(promotionRepository.findAll())
                .thenReturn(List.of(tenPercentCappedAtThirty, twentyPercentCappedAtTwenty));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(1L), anyCollection()))
                .thenReturn(List.of(link(tenPercentCappedAtThirty, product)));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(2L), anyCollection()))
                .thenReturn(List.of(link(twentyPercentCappedAtTwenty, product)));

        List<OrderPromotionSuggestionResponse> suggestions =
                orderService.promotionSuggestions(request);

        assertEquals(0, new BigDecimal("30000.00").compareTo(suggestions.get(0).discountAmount()));
        assertEquals(0, new BigDecimal("270000.00").compareTo(suggestions.get(0).finalAmount()));
        assertEquals(0, new BigDecimal("20000.00").compareTo(suggestions.get(1).discountAmount()));
        assertEquals(0, new BigDecimal("280000.00").compareTo(suggestions.get(1).finalAmount()));
    }

    @Test
    void reportsMinimumValueInactiveDatesAndProductScopeConditions() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Promotion minimum = promotion(
                1L, "MIN400", new BigDecimal("10"), null,
                new BigDecimal("400000"), true, today, today);
        Promotion inactive = promotion(
                2L, "PAUSED", new BigDecimal("10"), null,
                BigDecimal.ZERO, false, today, today);
        Promotion expired = promotion(
                3L, "EXPIRED", new BigDecimal("10"), null,
                BigDecimal.ZERO, true, today.minusDays(3), today.minusDays(1));
        Promotion upcoming = promotion(
                4L, "FUTURE", new BigDecimal("10"), null,
                BigDecimal.ZERO, true, today.plusDays(1), today.plusDays(3));
        Promotion wrongProduct = promotion(
                5L, "OTHER", new BigDecimal("10"), null,
                BigDecimal.ZERO, true, today, today);
        when(promotionRepository.findAll())
                .thenReturn(List.of(minimum, inactive, expired, upcoming, wrongProduct));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(5L), anyCollection()))
                .thenReturn(List.of());

        List<OrderPromotionSuggestionResponse> suggestions =
                orderService.promotionSuggestions(request);

        assertEquals(5, suggestions.size());
        assertEquals("Đơn hàng cần thêm 100000đ để đạt mức tối thiểu.", suggestions.get(0).message());
        assertEquals("Chương trình khuyến mãi đang tạm dừng.", suggestions.get(1).message());
        assertEquals("Chương trình đã hết hạn.", suggestions.get(2).message());
        assertEquals("Chương trình chưa bắt đầu.", suggestions.get(3).message());
        assertEquals(
                "Khuyến mãi không áp dụng cho sản phẩm trong giỏ hàng.",
                suggestions.get(4).message());
    }

    @Test
    void quoteWithoutPromotionKeepsOriginalOrderTotal() {
        OrderQuoteResponse quote = orderService.quote(request);

        assertEquals(0, new BigDecimal("300000.00").compareTo(quote.totalAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(quote.discountAmount()));
        assertEquals(0, new BigDecimal("300000.00").compareTo(quote.finalAmount()));
        assertEquals(null, quote.promotionCode());
    }

    @Test
    void applyingPromotionReturnsTheBackendCalculatedDiscountedTotal() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Promotion promotion = promotion(
                7L, "SAVE30", new BigDecimal("10"), new BigDecimal("30000"),
                BigDecimal.ZERO, true, today, today);
        when(promotionRepository.findByPromotionCodeIgnoreCase("SAVE30"))
                .thenReturn(Optional.of(promotion));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(7L), anyCollection()))
                .thenReturn(List.of(link(promotion, product)));

        OrderQuoteResponse quote = orderService.quote(
                new OrderQuoteRequest(request.items(), "SAVE30"));

        assertEquals("SAVE30", quote.promotionCode());
        assertEquals(0, new BigDecimal("30000.00").compareTo(quote.discountAmount()));
        assertEquals(0, new BigDecimal("270000.00").compareTo(quote.finalAmount()));
    }

    @Test
    void posQuoteChoosesTheLowestProductPriceAndShowsCatalogPrice() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Promotion tenPercent = promotion(
                1L, "TEN", new BigDecimal("10"), null, BigDecimal.ZERO,
                true, today, today);
        Promotion twentyPercent = promotion(
                2L, "TWENTY", new BigDecimal("20"), null, BigDecimal.ZERO,
                true, today, today);
        when(promotionRepository.findAll()).thenReturn(List.of(tenPercent, twentyPercent));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(1L), anyCollection()))
                .thenReturn(List.of(link(tenPercent, product)));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(2L), anyCollection()))
                .thenReturn(List.of(link(twentyPercent, product)));

        var quote = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(),
                List.of(11L),
                null,
                0
        ));

        assertEquals(1, quote.catalogPrices().size());
        assertEquals(
                0,
                new BigDecimal("80000.00").compareTo(quote.catalogPrices().get(0).salePrice())
        );
        assertEquals("TWENTY", quote.catalogPrices().get(0).promotionCode());
        assertEquals(BigDecimal.ZERO, quote.productDiscountAmount());
    }

    @Test
    void posQuoteCalculatesProductPromotionAndRedeemedPointsSeparately() {
        Customer customer = new Customer();
        customer.setId(7L);
        customer.setEmail("customer@example.test");
        customer.setStatus(true);
        customer.setLoyaltyPoints(25);
        when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
        when(promotionRepository.findAll()).thenReturn(List.of());

        var quote = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 3)),
                List.of(),
                7L,
                10
        ));

        assertEquals(0, new BigDecimal("300000.00").compareTo(quote.totalAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(quote.productDiscountAmount()));
        assertEquals(0, new BigDecimal("300000.00").compareTo(quote.subtotalAfterPromotions()));
        assertEquals(10, quote.loyaltyPointsToRedeem());
        assertEquals(0, new BigDecimal("10000.00").compareTo(quote.loyaltyDiscountAmount()));
        assertEquals(0, new BigDecimal("290000.00").compareTo(quote.finalAmount()));
        assertEquals(25, customer.getLoyaltyPoints());
    }

    @Test
    void posQuoteRejectsRedeemingMorePointsThanCustomerHas() {
        Customer customer = new Customer();
        customer.setId(7L);
        customer.setStatus(true);
        customer.setLoyaltyPoints(3);
        when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
        when(promotionRepository.findAll()).thenReturn(List.of());

        assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> orderService.quotePos(new PosOrderQuoteRequest(
                        List.of(new CreateOrderItemRequest(11L, 3)),
                        List.of(),
                        7L,
                        4
                ))
        );
    }

    @Test
    void posProductPromotionRespectsItsMaximumDiscount() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Promotion cappedPromotion = promotion(
                3L, "CAPPED", new BigDecimal("50"), new BigDecimal("15000"),
                BigDecimal.ZERO, true, today, today);
        when(promotionRepository.findAll()).thenReturn(List.of(cappedPromotion));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(3L), anyCollection()))
                .thenReturn(List.of(link(cappedPromotion, product)));

        var quote = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 1)),
                List.of(),
                null,
                0
        ));

        assertEquals(0, new BigDecimal("15000.00").compareTo(quote.productDiscountAmount()));
        assertEquals(0, new BigDecimal("85000.00").compareTo(quote.subtotalAfterPromotions()));
    }

    @Test
    void anotherProductsOrderValueDoesNotQualifyAnUnrelatedProductPromotion() {
        Product productB = product(12L, "Bánh B", "100000.00");
        Promotion promotionForB = promotion(
                8L, "B_MIN", new BigDecimal("20"), null,
                new BigDecimal("250000"), true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        when(productRepository.findAllById(anyCollection()))
                .thenReturn(List.of(product, productB));
        when(promotionRepository.findAll()).thenReturn(List.of(promotionForB));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(8L), anyCollection()))
                .thenReturn(List.of(link(promotionForB, productB)));

        var quote = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(
                        new CreateOrderItemRequest(11L, 3),
                        new CreateOrderItemRequest(12L, 1)
                ),
                List.of(11L, 12L),
                null,
                0
        ));

        assertEquals(0, BigDecimal.ZERO.compareTo(quote.items().get(1).productDiscountAmount()));
        assertEquals(
                0,
                new BigDecimal("100000.00").compareTo(quote.catalogPrices().get(1).salePrice())
        );
        assertEquals(0, new BigDecimal("400000.00").compareTo(quote.totalAmount()));
    }

    @Test
    void productMaximumDiscountIsAppliedIndependentlyToEachLinkedProduct() {
        Product productB = product(12L, "Bánh B", "100000.00");
        Promotion promotionForBoth = promotion(
                9L, "BOTH", new BigDecimal("20"), new BigDecimal("15000"),
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        when(productRepository.findAllById(anyCollection()))
                .thenReturn(List.of(product, productB));
        when(promotionRepository.findAll()).thenReturn(List.of(promotionForBoth));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(9L), anyCollection()))
                .thenReturn(List.of(
                        link(promotionForBoth, product),
                        link(promotionForBoth, productB)
                ));

        var quote = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(
                        new CreateOrderItemRequest(11L, 1),
                        new CreateOrderItemRequest(12L, 1)
                ),
                List.of(11L, 12L),
                null,
                0
        ));

        assertEquals(0, new BigDecimal("15000.00").compareTo(
                quote.items().get(0).productDiscountAmount()));
        assertEquals(0, new BigDecimal("15000.00").compareTo(
                quote.items().get(1).productDiscountAmount()));
        assertEquals(0, new BigDecimal("170000.00").compareTo(
                quote.subtotalAfterPromotions()));
    }

    @Test
    void catalogUnitPriceStaysStableAsCartQuantityChangesWithMaximumDiscount() {
        Promotion cappedPromotion = promotion(
                15L, "CAP15", new BigDecimal("20"), new BigDecimal("15000"),
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        when(promotionRepository.findAll()).thenReturn(List.of(cappedPromotion));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(15L), anyCollection()))
                .thenReturn(List.of(link(cappedPromotion, product)));

        var quantityOne = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 1)),
                List.of(11L),
                null,
                0
        ));
        var quantityTwo = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 2)),
                List.of(11L),
                null,
                0
        ));

        assertEquals(0, new BigDecimal("85000.00").compareTo(
                quantityOne.catalogPrices().get(0).salePrice()));
        assertEquals(0, new BigDecimal("85000.00").compareTo(
                quantityTwo.catalogPrices().get(0).salePrice()));
        assertEquals(0, new BigDecimal("85000.00").compareTo(
                quantityOne.items().get(0).effectiveUnitPrice()));
        assertEquals(0, new BigDecimal("92500.00").compareTo(
                quantityTwo.items().get(0).effectiveUnitPrice()));
    }

    @Test
    void customerQuoteAppliesActiveProductPromotionBeforeCheckout() {
        Promotion cappedPromotion = promotion(
                16L, "SHOP15", new BigDecimal("20"), new BigDecimal("15000"),
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        when(promotionRepository.findAll()).thenReturn(List.of(cappedPromotion));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(16L), anyCollection()))
                .thenReturn(List.of(link(cappedPromotion, product)));

        var quote = orderService.quoteCustomer(new OrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 2)),
                null
        ));

        assertEquals(0, new BigDecimal("200000.00").compareTo(quote.totalAmount()));
        assertEquals(0, new BigDecimal("15000.00").compareTo(quote.discountAmount()));
        assertEquals(0, new BigDecimal("185000.00").compareTo(quote.finalAmount()));
        assertEquals(0, new BigDecimal("185000.00").compareTo(
                quote.items().get(0).lineTotal()));
    }

    @Test
    void customerOrderStoresTheDiscountedAmountForPayment() {
        Customer customer = new Customer();
        customer.setId(21L);
        customer.setStatus(true);
        Promotion promotion = promotion(
                17L, "SHOP15", new BigDecimal("20"), new BigDecimal("15000"),
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        Order order = new Order();
        when(orderRepository.findByCustomer_IdAndCustomerRequestKey(21L, "request-key"))
                .thenReturn(Optional.empty());
        when(productRepository.findAllByIdForUpdate(anyList())).thenReturn(List.of(product));
        when(promotionRepository.findAll()).thenReturn(List.of(promotion));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(17L), anyCollection()))
                .thenReturn(List.of(link(promotion, product)));
        when(orderMapper.toEntity(any(), same(customer), isNull()))
                .thenAnswer(invocation -> {
                    var createRequest = invocation.<com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderRequest>getArgument(0);
                    assertEquals(true, createRequest.applyProductPromotions());
                    return order;
                });
        when(orderRepository.saveAndFlush(any(Order.class))).thenAnswer(invocation -> {
            Order savedOrder = invocation.getArgument(0);
            savedOrder.setId(42L);
            return savedOrder;
        });
        when(orderRepository.existsByOrderCode("DH000042")).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toEntity(
                same(order),
                same(product),
                any(CreateOrderItemRequest.class),
                any(BigDecimal.class),
                any(BigDecimal.class),
                any(BigDecimal.class)
        )).thenAnswer(invocation -> {
            OrderItem item = new OrderItem();
            item.setOrder(invocation.getArgument(0));
            item.setProduct(invocation.getArgument(1));
            item.setQuantity(((CreateOrderItemRequest) invocation.getArgument(2)).quantity());
            item.setUnitPrice(invocation.getArgument(3));
            item.setDiscountAmount(invocation.getArgument(4));
            item.setLineTotal(invocation.getArgument(5));
            return item;
        });
        when(orderItemRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(same(order), anyList(), any(BigDecimal.class)))
                .thenAnswer(invocation -> {
                    BigDecimal finalAmount = invocation.getArgument(2);
                    return new OrderResponse(
                            order.getId(), order.getOrderCode(), customer.getId(), null,
                            order.getOrderDate(), order.getDeliveryAddress(), order.getDeliveryStatus(),
                            order.getTotalAmount(), order.getDiscountAmount(), finalAmount,
                            order.getStatus(), order.getCreatedAt(), List.of(), null, null, null
                    );
                });

        OrderResponse response = orderService.createCustomerOrder(
                customer,
                new CustomerOrderRequest(
                        null,
                        List.of(new CreateOrderItemRequest(11L, 2)),
                        null,
                        null,
                        null
                ),
                "request-key"
        );

        assertEquals(0, new BigDecimal("185000.00").compareTo(order.getTotalAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(order.getDiscountAmount()));
        assertEquals(0, new BigDecimal("185000.00").compareTo(response.finalAmount()));
    }

    @Test
    void bestPromotionIsChosenSeparatelyForEachProduct() {
        Product productB = product(12L, "Bánh B", "200000.00");
        Promotion firstForA = promotion(
                10L, "A_10", new BigDecimal("10"), null,
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        Promotion bestForA = promotion(
                11L, "A_20", new BigDecimal("20"), null,
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        Promotion forB = promotion(
                12L, "B_5", new BigDecimal("5"), null,
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        when(productRepository.findAllById(anyCollection()))
                .thenReturn(List.of(product, productB));
        when(promotionRepository.findAll()).thenReturn(List.of(firstForA, bestForA, forB));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(10L), anyCollection()))
                .thenReturn(List.of(link(firstForA, product)));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(11L), anyCollection()))
                .thenReturn(List.of(link(bestForA, product)));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(12L), anyCollection()))
                .thenReturn(List.of(link(forB, productB)));

        var quote = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(
                        new CreateOrderItemRequest(11L, 1),
                        new CreateOrderItemRequest(12L, 1)
                ),
                List.of(11L, 12L),
                null,
                0
        ));

        assertEquals(0, new BigDecimal("20000.00").compareTo(
                quote.items().get(0).productDiscountAmount()));
        assertEquals("A_20", quote.items().get(0).promotionCode());
        assertEquals(0, new BigDecimal("10000.00").compareTo(
                quote.items().get(1).productDiscountAmount()));
        assertEquals("B_5", quote.items().get(1).promotionCode());
        assertEquals(0, new BigDecimal("270000.00").compareTo(
                quote.subtotalAfterPromotions()));
    }

    @Test
    void addingOrRemovingAnotherProductDoesNotChangeExistingProductPrice() {
        Product productB = product(12L, "Bánh B", "200000.00");
        Promotion promotionForA = promotion(
                13L, "A_ONLY", new BigDecimal("10"), null,
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        when(productRepository.findAllById(anyCollection()))
                .thenReturn(List.of(product, productB));
        when(promotionRepository.findAll()).thenReturn(List.of(promotionForA));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(13L), anyCollection()))
                .thenReturn(List.of(link(promotionForA, product)));

        var quoteWithA = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 3)),
                List.of(11L, 12L),
                null,
                0
        ));
        var quoteWithAAndB = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(
                        new CreateOrderItemRequest(11L, 3),
                        new CreateOrderItemRequest(12L, 1)
                ),
                List.of(11L, 12L),
                null,
                0
        ));
        var quoteAfterRemovingA = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(12L, 1)),
                List.of(12L),
                null,
                0
        ));

        assertEquals(0, new BigDecimal("30000.00").compareTo(
                quoteWithA.items().get(0).productDiscountAmount()));
        assertEquals(0, new BigDecimal("30000.00").compareTo(
                quoteWithAAndB.items().get(0).productDiscountAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(
                quoteWithAAndB.items().get(1).productDiscountAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(
                quoteAfterRemovingA.items().get(0).productDiscountAmount()));
        assertEquals(0, new BigDecimal("270000.00").compareTo(
                quoteWithAAndB.items().get(0).lineTotal()));
        assertEquals(0, new BigDecimal("200000.00").compareTo(
                quoteWithAAndB.items().get(1).lineTotal()));
        assertEquals(0, new BigDecimal("500000.00").compareTo(
                quoteWithAAndB.totalAmount()));
        assertEquals(0, new BigDecimal("470000.00").compareTo(
                quoteWithAAndB.subtotalAfterPromotions()));
        assertEquals(0, new BigDecimal("200000.00").compareTo(
                quoteAfterRemovingA.finalAmount()));
    }

    @Test
    void changingQuantityRecalculatesOnlyThatProductsLineAmount() {
        Promotion promotionForA = promotion(
                14L, "A_10", new BigDecimal("10"), null,
                BigDecimal.ZERO, true,
                LocalDate.now(ZoneOffset.UTC), LocalDate.now(ZoneOffset.UTC));
        when(promotionRepository.findAll()).thenReturn(List.of(promotionForA));
        when(promotionProductRepository.findByPromotion_IdAndProduct_IdIn(
                eq(14L), anyCollection()))
                .thenReturn(List.of(link(promotionForA, product)));

        var quantityTwo = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 2)),
                List.of(),
                null,
                0
        ));
        var quantityThree = orderService.quotePos(new PosOrderQuoteRequest(
                List.of(new CreateOrderItemRequest(11L, 3)),
                List.of(),
                null,
                0
        ));

        assertEquals(0, new BigDecimal("20000.00").compareTo(
                quantityTwo.items().get(0).productDiscountAmount()));
        assertEquals(0, new BigDecimal("180000.00").compareTo(
                quantityTwo.items().get(0).lineTotal()));
        assertEquals(0, new BigDecimal("30000.00").compareTo(
                quantityThree.items().get(0).productDiscountAmount()));
        assertEquals(0, new BigDecimal("270000.00").compareTo(
                quantityThree.items().get(0).lineTotal()));
    }

    private Promotion promotion(
            Long id,
            String code,
            BigDecimal percent,
            BigDecimal maxDiscount,
            BigDecimal minimum,
            boolean active,
            LocalDate startDate,
            LocalDate endDate) {
        Promotion promotion = new Promotion();
        promotion.setId(id);
        promotion.setPromotionCode(code);
        promotion.setName("Ưu đãi " + code);
        promotion.setDiscountPercent(percent);
        promotion.setMaxDiscount(maxDiscount);
        promotion.setMinOrderValue(minimum);
        promotion.setStatus(active);
        promotion.setStartDate(startDate);
        promotion.setEndDate(endDate);
        return promotion;
    }

    private Product product(Long id, String name, String price) {
        Product result = new Product();
        result.setId(id);
        result.setName(name);
        result.setPrice(new BigDecimal(price));
        result.setQuantity(10);
        result.setStatus(true);
        return result;
    }

    private PromotionProduct link(Promotion promotion, Product product) {
        PromotionProduct link = new PromotionProduct();
        link.setPromotion(promotion);
        link.setProduct(product);
        return link;
    }
}
