package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderItemRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.CustomerOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderPromotionSuggestionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.PosCatalogPriceResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.PosOrderQuoteItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.PosOrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.PosOrderQuoteResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.mapper.OrderMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * Service xử lý các thao tác liên quan đến Order.
 *
 * Luồng xử lý:
 *
 * Controller
 * ↓
 * OrderService
 * ↓
 * OrderRepository
 * ↓
 * Database
 */
@Service
public class OrderService {

    private static final String WALK_IN_CUSTOMER_EMAIL = "pos.walkin@example.invalid";
    private static final BigDecimal LOYALTY_DISCOUNT_PER_POINT =
            new BigDecimal("1000.00");
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionAttemptRepository paymentTransactionAttemptRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final OrderMapper orderMapper;
    private final OrderStatusHistoryService orderStatusHistoryService;
    private final OrderConfirmationEmailService orderConfirmationEmailService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            ProductRepository productRepository,
            PaymentRepository paymentRepository,
            PaymentTransactionAttemptRepository paymentTransactionAttemptRepository,
            PromotionRepository promotionRepository,
            PromotionProductRepository promotionProductRepository,
            OrderMapper orderMapper,
            OrderStatusHistoryService orderStatusHistoryService,
            OrderConfirmationEmailService orderConfirmationEmailService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.productRepository = productRepository;
        this.paymentRepository = paymentRepository;
        this.paymentTransactionAttemptRepository = paymentTransactionAttemptRepository;
        this.promotionRepository = promotionRepository;
        this.promotionProductRepository = promotionProductRepository;
        this.orderMapper = orderMapper;
        this.orderStatusHistoryService = orderStatusHistoryService;
        this.orderConfirmationEmailService = orderConfirmationEmailService;
    }

    /**
     * Lấy tất cả đơn hàng.
     *
     * findAll() được JpaRepository cung cấp sẵn.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> findAll() {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();
        if (orders.isEmpty()) {
            return List.of();
        }

        List<Long> orderIds = orders.stream()
                .map(Order::getId)
                .toList();
        Map<Long, List<OrderItem>> itemsByOrderId = new HashMap<>();
        for (OrderItem item : orderItemRepository.findByOrder_IdIn(orderIds)) {
            if (item.getOrder() == null || item.getOrder().getId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Chi tiết đơn hàng không liên kết với đơn hàng hợp lệ"
                );
            }
            itemsByOrderId.computeIfAbsent(
                    item.getOrder().getId(),
                    ignored -> new ArrayList<>()
            ).add(item);
        }

        return orders.stream()
                .map(order -> toResponse(
                        order,
                        itemsByOrderId.getOrDefault(order.getId(), List.of())
                ))
                .toList();
    }

    /**
     * Tìm đơn hàng theo ID.
     *
     * Trả HTTP 404 nếu không tìm thấy đơn hàng.
     */
    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        Order order = findOrderById(id);
        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(id);
        return toResponse(order, orderItems);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByCustomerId(Long customerId) {
        List<Order> orders = orderRepository.findByCustomer_IdOrderByOrderDateDesc(customerId);
        return toResponses(orders);
    }

    @Transactional(readOnly = true)
    public OrderResponse findByIdAndCustomerId(Long id, Long customerId) {
        Order order = orderRepository.findByIdAndCustomer_Id(id, customerId)
                .orElseThrow(() -> notFound("Không tìm thấy đơn hàng", id));
        return toResponse(order, orderItemRepository.findByOrder_Id(id));
    }

    @Transactional(readOnly = true)
    public OrderResponse findByCustomerIdAndRequestKey(Long customerId, String customerRequestKey) {
        Order order = orderRepository
                .findByCustomer_IdAndCustomerRequestKey(customerId, customerRequestKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        return toResponse(order, orderItemRepository.findByOrder_Id(order.getId()));
    }

    @Transactional(readOnly = true)
    public OrderQuoteResponse quote(OrderQuoteRequest request) {
        validateItems(request == null ? null : request.items());
        Map<Long, Product> productsById = loadProducts(request.items(), false);
        List<PromotionLine> lines = promotionLines(request.items(), productsById);
        OrderAmounts amounts = calculateOrderAmounts(lines, request.promotionCode());
        return toQuoteResponse(lines, amounts);
    }

    @Transactional(readOnly = true)
    public List<OrderPromotionSuggestionResponse> promotionSuggestions(
            OrderQuoteRequest request) {
        validateItems(request == null ? null : request.items());
        Map<Long, Product> productsById = loadProducts(request.items(), false);
        List<PromotionLine> lines = promotionLines(request.items(), productsById);
        BigDecimal totalAmount = calculateOrderAmounts(lines, (Promotion) null)
                .totalAmount();

        return promotionRepository.findAll().stream()
                .map(promotion -> {
                    try {
                        OrderAmounts amounts = calculateOrderAmounts(lines, promotion);
                        return new OrderPromotionSuggestionResponse(
                                promotion.getId(),
                                promotion.getPromotionCode(),
                                promotion.getName(),
                                promotion.getDiscountPercent(),
                                promotion.getMaxDiscount(),
                                promotion.getMinOrderValue(),
                                true,
                                amounts.discountAmount(),
                                amounts.totalAmount().subtract(amounts.discountAmount()),
                                null
                        );
                    } catch (ResponseStatusException exception) {
                        return new OrderPromotionSuggestionResponse(
                                promotion.getId(),
                                promotion.getPromotionCode(),
                                promotion.getName(),
                                promotion.getDiscountPercent(),
                                promotion.getMaxDiscount(),
                                promotion.getMinOrderValue(),
                                false,
                                BigDecimal.ZERO,
                                totalAmount,
                                promotionIneligibilityMessage(
                                        promotion,
                                        totalAmount,
                                        exception
                                )
                        );
                    }
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PosOrderQuoteResponse quotePos(PosOrderQuoteRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thông tin báo giá không hợp lệ"
            );
        }
        List<CreateOrderItemRequest> items = request.items() == null
                ? List.of()
                : request.items();
        if (!items.isEmpty()) validateItems(items);
        Map<Long, Product> productsById = items.isEmpty()
                ? new HashMap<>()
                : loadProducts(items, false);
        List<PromotionLine> lines = promotionLines(items, productsById);
        PosOrderAmounts amounts = calculatePosOrderAmounts(
                lines,
                request.customerId(),
                request.loyaltyPointsToRedeem(),
                false
        );

        List<PosOrderQuoteItemResponse> itemResponses = lines.stream()
                .map(line -> {
                    BigDecimal itemDiscount = amounts.lineDiscounts()
                            .getOrDefault(line.productId(), BigDecimal.ZERO);
                    BigDecimal lineTotal = line.subtotal().subtract(itemDiscount);
                    BigDecimal effectiveUnitPrice = lineTotal.divide(
                            BigDecimal.valueOf(line.quantity()),
                            2,
                            RoundingMode.HALF_UP
                    );
                    return new PosOrderQuoteItemResponse(
                            line.productId(),
                            line.productName(),
                            line.quantity(),
                            line.unitPrice(),
                            effectiveUnitPrice,
                            itemDiscount,
                            lineTotal
                    );
                })
                .toList();

        List<PosCatalogPriceResponse> catalogPrices =
                getPosCatalogPrices(lines, request.productIds());

        return new PosOrderQuoteResponse(
                amounts.totalAmount(),
                amounts.productDiscountAmount(),
                amounts.subtotalAfterPromotions(),
                amounts.loyaltyPointsToRedeem(),
                amounts.loyaltyDiscountAmount(),
                amounts.finalAmount(),
                itemResponses,
                catalogPrices
        );
    }

    /**
     * Lưu đơn, giữ tồn kho và lưu chi tiết trong cùng transaction.
     */
    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        validateRequest(request);

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> notFound("Không tìm thấy khách hàng", request.customerId()));
        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> notFound("Không tìm thấy nhân viên", request.employeeId()));

        requireActive(customer.getStatus(), "Khách hàng");
        requireActive(employee.getStatus(), "Nhân viên");

        return createOrder(
                request,
                customer,
                employee,
                null,
                true
        );
    }

    @Transactional
    public OrderResponse createForAuthenticatedEmployee(CreateOrderRequest request, String username) {
        Employee currentEmployee = employeeRepository.findByAccount_UsernameAndStatusTrue(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tài khoản đăng nhập chưa được liên kết với hồ sơ nhân viên đang hoạt động"
                ));
        if (request == null || !currentEmployee.getId().equals(request.employeeId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Chỉ được tạo đơn bằng hồ sơ nhân viên của tài khoản đang đăng nhập"
            );
        }
        return create(request);
    }

    @Transactional
    public OrderResponse createCustomerOrder(
            Customer customer,
            CustomerOrderRequest request,
            String customerRequestKey) {
        if (request == null || customer == null || customer.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin đặt hàng không hợp lệ");
        }
        requireActive(customer.getStatus(), "Khách hàng");
        validateCustomerOrderRequest(request);

        Order existingOrder = orderRepository
                .findByCustomer_IdAndCustomerRequestKey(customer.getId(), customerRequestKey)
                .orElse(null);
        if (existingOrder != null) {
            List<OrderItem> existingItems = orderItemRepository.findByOrder_Id(existingOrder.getId());
            if (!matchesCustomerOrder(existingOrder, existingItems, request)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Khóa yêu cầu đặt hàng đã được sử dụng cho dữ liệu khác"
                );
            }
            return toResponse(existingOrder, existingItems);
        }

        CreateOrderRequest orderRequest = new CreateOrderRequest(
                customer.getId(),
                null,
                request.deliveryAddress(),
                request.items(),
                request.promotionCode(),
                request.note()
        );
        return createOrder(
                orderRequest,
                customer,
                null,
                customerRequestKey,
                false
        );
    }

    private OrderResponse createOrder(
            CreateOrderRequest request,
            Customer customer,
            Employee employee,
            String customerRequestKey,
            boolean sendConfirmationEmail) {
        validateUniqueProducts(request.items());
        Map<Long, Product> productsById = loadProducts(request.items(), true);
        List<PromotionLine> lines = promotionLines(request.items(), productsById);
        boolean applyProductPromotions = Boolean.TRUE.equals(request.applyProductPromotions());
        if (applyProductPromotions && request.promotionCode() != null
                && !request.promotionCode().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "POS không hỗ trợ nhập mã khuyến mãi; ưu đãi sản phẩm được tự động áp dụng"
            );
        }
        OrderAmounts standardAmounts = applyProductPromotions
                ? null
                : calculateOrderAmounts(lines, request.promotionCode());
        PosOrderAmounts posAmounts = applyProductPromotions
                ? calculatePosOrderAmounts(
                        lines,
                        customer.getId(),
                        request.loyaltyPointsToRedeem(),
                        true
                )
                : null;
        BigDecimal orderTotalAmount = applyProductPromotions
                ? posAmounts.subtotalAfterPromotions()
                : standardAmounts.totalAmount();
        BigDecimal orderDiscountAmount = applyProductPromotions
                ? posAmounts.loyaltyDiscountAmount()
                : standardAmounts.discountAmount();
        Promotion orderPromotion = applyProductPromotions
                ? null
                : standardAmounts.promotion();
        Map<Long, BigDecimal> itemDiscounts = applyProductPromotions
                ? posAmounts.lineDiscounts()
                : standardAmounts.lineDiscounts();

        for (CreateOrderItemRequest item : request.items()) {
            Product product = productsById.get(item.productId());
            product.setQuantity(product.getQuantity() - item.quantity());
        }
        productRepository.saveAll(productsById.values());

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        String deliveryAddress = request.deliveryAddress();
        boolean requiresDelivery = deliveryAddress != null && !deliveryAddress.isBlank();

        Order order = orderMapper.toEntity(request, customer, employee);
        order.setDeliveryAddress(requiresDelivery ? deliveryAddress.trim() : null);
        order.setDeliveryStatus(requiresDelivery ? "PENDING" : "NOT_REQUIRED");
        order.setStatus("PENDING");
        order.setOrderDate(now);
        order.setCreatedAt(now);
        order.setTotalAmount(orderTotalAmount);
        order.setDiscountAmount(orderDiscountAmount);
        order.setPromotion(orderPromotion);
        order.setPromotionCodeSnapshot(
                orderPromotion == null ? null : orderPromotion.getPromotionCode()
        );
        order.setNote(normalizeOptionalText(request.note()));
        order.setStockReserved(true);
        order.setCustomerRequestKey(customerRequestKey);

        // Lưu trước để database cấp ID; ID giúp sinh mã khác nhau cho các đơn tạo đồng thời.
        order = orderRepository.saveAndFlush(order);
        String orderCode = String.format(Locale.ROOT, "DH%06d", order.getId());
        if (orderRepository.existsByOrderCode(orderCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã đơn hàng đã tồn tại: " + orderCode
            );
        }
        order.setOrderCode(orderCode);
        order = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        for (int index = 0; index < request.items().size(); index++) {
            CreateOrderItemRequest itemRequest = request.items().get(index);
            Product product = productsById.get(itemRequest.productId());
            PromotionLine line = lines.get(index);
            BigDecimal itemDiscount = itemDiscounts
                    .getOrDefault(itemRequest.productId(), BigDecimal.ZERO);
            BigDecimal lineTotal = line.unitPrice()
                    .multiply(BigDecimal.valueOf(line.quantity()))
                    .subtract(itemDiscount);
            OrderItem orderItem = orderMapper.toEntity(
                    order,
                    product,
                    itemRequest,
                    line.unitPrice(),
                    itemDiscount,
                    lineTotal
            );
            orderItems.add(orderItem);
        }

        order = orderRepository.save(order);
        List<OrderItem> savedItems = orderItemRepository.saveAll(orderItems);
        orderStatusHistoryService.recordStatusChangeAfterCommit(
                order.getId(), null, "PENDING", "Tạo đơn hàng");
        if (sendConfirmationEmail) {
            orderConfirmationEmailService.sendOrderConfirmation(order, savedItems);
        }
        return toResponse(order, savedItems);
    }

    @Transactional
    public OrderResponse cancel(Long id) {
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> notFound("Không tìm thấy đơn hàng", id));
        if (!"PENDING".equals(order.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ có thể hủy đơn hàng đang ở trạng thái PENDING"
            );
        }

        paymentRepository.findByOrder_IdForUpdate(id).ifPresent(payment -> {
            if ("SUCCESS".equals(payment.getStatus())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không thể hủy đơn hàng đã thanh toán thành công"
                );
            }
            if ("VNPAY".equalsIgnoreCase(payment.getPaymentMethod())) {
                List<PaymentTransactionAttempt> attempts =
                        paymentTransactionAttemptRepository
                                .findByPayment_IdOrderByCreatedAtDesc(payment.getId());
                boolean hasUnresolvedAttempt = attempts.stream().anyMatch(attempt ->
                        !"FAILED".equalsIgnoreCase(attempt.getStatus())
                                && !"EXPIRED".equalsIgnoreCase(attempt.getStatus()));
                if (hasUnresolvedAttempt) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Không thể hủy đơn hàng khi giao dịch VNPay đang cần đối soát"
                    );
                }
                if (attempts.isEmpty()) {
                    paymentRepository.delete(payment);
                }
                return;
            }
            paymentRepository.delete(payment);
        });

        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(id);
        if (order.isStockReserved()) {
            restoreReservedStock(orderItems);
            order.setStockReserved(false);
        }
        String oldStatus = order.getStatus();
        order.setStatus("CANCELLED");
        orderRepository.saveAndFlush(order);
        orderStatusHistoryService.recordStatusChangeAfterCommit(
                order.getId(), oldStatus, order.getStatus(), "Hủy đơn hàng");
        return toResponse(order, orderItems);
    }

    @Transactional
    public OrderResponse markDelivered(Long id) {
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> notFound("Không tìm thấy đơn hàng", id));
        requireConfirmedOrder(order);
        if (!"PENDING".equals(order.getDeliveryStatus())
                || order.getDeliveryAddress() == null
                || order.getDeliveryAddress().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ đơn giao tận nơi đang chờ giao mới có thể đánh dấu đã giao"
            );
        }
        requireSuccessfulPayment(id);

        order.setDeliveryStatus("DELIVERED");
        orderRepository.saveAndFlush(order);
        return toResponse(order, orderItemRepository.findByOrder_Id(id));
    }

    @Transactional
    public OrderResponse complete(Long id) {
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> notFound("Không tìm thấy đơn hàng", id));
        requireConfirmedOrder(order);
        if (!"DELIVERED".equals(order.getDeliveryStatus())
                && !"NOT_REQUIRED".equals(order.getDeliveryStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn giao tận nơi phải được đánh dấu đã giao trước khi hoàn tất"
            );
        }
        requireSuccessfulPayment(id);

        String oldStatus = order.getStatus();
        order.setStatus("COMPLETED");
        orderRepository.saveAndFlush(order);
        orderStatusHistoryService.recordStatusChangeAfterCommit(
                order.getId(), oldStatus, order.getStatus(), "Hoàn tất đơn hàng");
        return toResponse(order, orderItemRepository.findByOrder_Id(id));
    }

    /**
     * Cập nhật số lượng dòng hàng và đồng bộ tổng tiền trước giảm của đơn.
     */
    @Transactional
    public OrderItemResponse updateOrderItem(
            Long orderItemId,
            OrderItemUpdateRequest request) {
        if (request == null || request.quantity() == null || request.quantity() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng sản phẩm phải lớn hơn 0"
            );
        }

        OrderItem orderItem = findOrderItemById(orderItemId);
        Order order = findParentOrder(orderItem);
        ensureOrderItemsEditable(order);
        Long productId = orderItem.getProduct().getId();
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> notFound("Không tìm thấy sản phẩm", productId));
        int quantityChange = request.quantity() - orderItem.getQuantity();
        adjustStock(product, -quantityChange);
        productRepository.save(product);
        orderItem.setQuantity(request.quantity());
        OrderItem savedOrderItem = orderItemRepository.saveAndFlush(orderItem);
        recalculateOrderTotal(order);

        return orderMapper.toItemResponse(savedOrderItem);
    }

    /**
     * Xóa dòng hàng, nhưng không cho phép đơn tồn tại mà không còn sản phẩm.
     */
    @Transactional
    public void deleteOrderItem(Long orderItemId) {
        OrderItem orderItem = findOrderItemById(orderItemId);
        Order order = findParentOrder(orderItem);
        ensureOrderItemsEditable(order);
        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(order.getId());
        if (orderItems.size() <= 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa chi tiết cuối cùng của đơn hàng"
            );
        }

        if (order.isStockReserved()) {
            Product product = productRepository.findByIdForUpdate(
                            orderItem.getProduct().getId())
                    .orElseThrow(() -> notFound(
                            "Không tìm thấy sản phẩm",
                            orderItem.getProduct().getId()
                    ));
            adjustStock(product, orderItem.getQuantity());
            productRepository.save(product);
        }
        orderItemRepository.delete(orderItem);
        orderItemRepository.flush();
        recalculateOrderTotal(order);
    }

    /**
     * Chỉ cho phép cập nhật địa chỉ giao hàng, không thay đổi trạng thái giao hàng.
     */
    @Transactional
    public OrderResponse updateOrder(Long id, OrderUpdateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thông tin cập nhật đơn hàng là bắt buộc"
            );
        }

        Order order = findOrderById(id);
        order.setDeliveryAddress(request.deliveryAddress());
        order = orderRepository.save(order);

        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(id);
        return toResponse(order, orderItems);
    }

    /**
     * Chỉ xóa Order khi không còn OrderItem hoặc Payment tham chiếu đến đơn đó.
     */
    @Transactional
    public void deleteOrder(Long id) {
        Order order = findOrderById(id);
        if (!orderItemRepository.findByOrder_Id(id).isEmpty()
                || paymentRepository.existsByOrder_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa đơn hàng đang có chi tiết hoặc thanh toán liên quan"
            );
        }

        orderRepository.delete(order);
        orderRepository.flush();
    }

    private Map<Long, Product> loadProducts(
            List<CreateOrderItemRequest> items,
            boolean lockForUpdate) {
        validateUniqueProducts(items);
        Set<Long> productIds = new TreeSet<>();
        items.forEach(item -> productIds.add(item.productId()));
        List<Product> products = lockForUpdate
                ? productRepository.findAllByIdForUpdate(new ArrayList<>(productIds))
                : productRepository.findAllById(productIds);
        Map<Long, Product> productsById = new HashMap<>();
        products.forEach(product -> productsById.put(product.getId(), product));

        for (CreateOrderItemRequest item : items) {
            Product product = productsById.get(item.productId());
            if (product == null) {
                throw notFound("Không tìm thấy sản phẩm", item.productId());
            }
            requireActive(product.getStatus(), "Sản phẩm");
            requireMoneyValue(product.getPrice(), "Sản phẩm có giá không hợp lệ");
            if (product.getQuantity() == null || product.getQuantity() < item.quantity()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Sản phẩm không đủ tồn kho: " + product.getName()
                );
            }
        }
        return productsById;
    }

    private void validateCustomerOrderRequest(CustomerOrderRequest request) {
        if (request.deliveryAddress() != null && request.deliveryAddress().length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Địa chỉ giao hàng không được vượt quá 255 ký tự"
            );
        }
        if (request.note() != null && request.note().length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ghi chú đơn hàng không được vượt quá 500 ký tự"
            );
        }
        validateItems(request.items());
    }

    private boolean matchesCustomerOrder(
            Order order,
            List<OrderItem> existingItems,
            CustomerOrderRequest request) {
        if (!java.util.Objects.equals(
                normalizeOptionalText(order.getDeliveryAddress()),
                normalizeOptionalText(request.deliveryAddress()))
                || !java.util.Objects.equals(
                normalizeOptionalText(order.getNote()),
                normalizeOptionalText(request.note()))
                || !normalizeOptionalCode(order.getPromotionCodeSnapshot())
                .equals(normalizeOptionalCode(request.promotionCode()))) {
            return false;
        }

        Map<Long, Integer> savedQuantities = new HashMap<>();
        for (OrderItem item : existingItems) {
            if (item.getProduct() == null || item.getProduct().getId() == null) {
                return false;
            }
            savedQuantities.put(item.getProduct().getId(), item.getQuantity());
        }
        Map<Long, Integer> requestedQuantities = new HashMap<>();
        for (CreateOrderItemRequest item : request.items()) {
            requestedQuantities.put(item.productId(), item.quantity());
        }
        return savedQuantities.equals(requestedQuantities);
    }

    private String normalizeOptionalCode(String value) {
        String normalized = normalizeOptionalText(value);
        return normalized == null ? "" : normalized.toUpperCase(Locale.ROOT);
    }

    private List<PromotionLine> promotionLines(
            List<CreateOrderItemRequest> items,
            Map<Long, Product> productsById) {
        return items.stream()
                .map(item -> {
                    Product product = productsById.get(item.productId());
                    return new PromotionLine(
                            product.getId(),
                            product.getName(),
                            item.quantity(),
                            product.getPrice()
                    );
                })
                .toList();
    }

    private PosOrderAmounts calculatePosOrderAmounts(
            List<PromotionLine> lines,
            Long customerId,
            Integer requestedPoints,
            boolean lockCustomer) {
        BigDecimal totalAmount = lines.stream()
                .map(PromotionLine::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<Long, BigDecimal> lineDiscounts =
                calculateBestProductPromotionDiscounts(lines);
        BigDecimal productDiscountAmount = lineDiscounts.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal subtotalAfterPromotions = totalAmount.subtract(productDiscountAmount);
        int pointsToRedeem = requestedPoints == null ? 0 : requestedPoints;
        if (pointsToRedeem < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điểm sử dụng không được âm"
            );
        }

        if (pointsToRedeem > 0) {
            if (customerId == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Vui lòng chọn khách hàng để sử dụng điểm"
                );
            }
            Customer customer = (lockCustomer
                    ? customerRepository.findByIdForUpdate(customerId)
                    : customerRepository.findById(customerId))
                    .orElseThrow(() -> notFound("Không tìm thấy khách hàng", customerId));
            requireActive(customer.getStatus(), "Khách hàng");
            int availablePoints = customer.getLoyaltyPoints() == null
                    ? 0
                    : customer.getLoyaltyPoints();
            int maximumPoints = Math.min(
                    availablePoints,
                    maxRedeemablePoints(subtotalAfterPromotions)
            );
            if (pointsToRedeem > maximumPoints) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Số điểm sử dụng vượt quá điểm hiện có hoặc số tiền được giảm"
                );
            }
            if (WALK_IN_CUSTOMER_EMAIL.equalsIgnoreCase(customer.getEmail())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Khách vãng lai không thể sử dụng điểm"
                );
            }
        }

        BigDecimal loyaltyDiscountAmount = LOYALTY_DISCOUNT_PER_POINT
                .multiply(BigDecimal.valueOf(pointsToRedeem));
        BigDecimal finalAmount = subtotalAfterPromotions.subtract(loyaltyDiscountAmount);
        return new PosOrderAmounts(
                totalAmount,
                productDiscountAmount,
                subtotalAfterPromotions,
                pointsToRedeem,
                loyaltyDiscountAmount,
                finalAmount,
                lineDiscounts
        );
    }

    private int maxRedeemablePoints(BigDecimal payableAmount) {
        if (payableAmount == null || payableAmount.signum() <= 0) return 0;
        BigDecimal amountAvailableForPoints = payableAmount.subtract(new BigDecimal("0.01"));
        if (amountAvailableForPoints.signum() < 0) return 0;
        try {
            return amountAvailableForPoints
                    .divideToIntegralValue(LOYALTY_DISCOUNT_PER_POINT)
                    .intValueExact();
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điểm quy đổi vượt quá giới hạn cho phép"
            );
        }
    }

    private Map<Long, BigDecimal> calculateBestProductPromotionDiscounts(
            List<PromotionLine> lines) {
        List<Promotion> promotions = promotionRepository.findAll();
        Set<Long> productIds = lines.stream()
                .map(PromotionLine::productId)
                .collect(java.util.stream.Collectors.toSet());
        Map<Long, Set<Long>> eligibleProductIdsByPromotion =
                loadEligibleProductIdsByPromotion(promotions, productIds);
        return calculateBestProductPromotionDiscounts(
                lines,
                promotions,
                eligibleProductIdsByPromotion
        );
    }

    private Map<Long, BigDecimal> calculateBestProductPromotionDiscounts(
            List<PromotionLine> lines,
            List<Promotion> promotions,
            Map<Long, Set<Long>> eligibleProductIdsByPromotion) {
        Map<Long, BigDecimal> bestDiscounts = new LinkedHashMap<>();
        lines.forEach(line -> bestDiscounts.put(line.productId(), BigDecimal.ZERO));
        if (lines.isEmpty()) return bestDiscounts;

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (Promotion promotion : promotions) {
            if (!Boolean.TRUE.equals(promotion.getStatus())
                    || promotion.getStartDate() == null
                    || promotion.getEndDate() == null
                    || today.isBefore(promotion.getStartDate())
                    || today.isAfter(promotion.getEndDate())) {
                continue;
            }
            BigDecimal discountPercent = promotion.getDiscountPercent();
            BigDecimal maximumDiscount = promotion.getMaxDiscount();
            BigDecimal minimumOrderValue = promotion.getMinOrderValue();
            if (discountPercent == null
                    || discountPercent.signum() <= 0
                    || discountPercent.compareTo(new BigDecimal("100")) > 0
                    || (maximumDiscount != null && maximumDiscount.signum() < 0)
                    || (minimumOrderValue != null && minimumOrderValue.signum() < 0)) {
                continue;
            }

            Set<Long> eligibleProductIds = eligibleProductIdsByPromotion
                    .getOrDefault(promotion.getId(), Set.of());
            for (PromotionLine line : lines) {
                BigDecimal lineSubtotal = line.subtotal();
                if (!eligibleProductIds.contains(line.productId())
                        || lineSubtotal.signum() <= 0
                        || (minimumOrderValue != null
                        && lineSubtotal.compareTo(minimumOrderValue) < 0)) {
                    continue;
                }
                BigDecimal candidateDiscount = lineSubtotal
                        .multiply(discountPercent)
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                if (maximumDiscount != null) {
                    candidateDiscount = candidateDiscount.min(maximumDiscount);
                }
                candidateDiscount = candidateDiscount.min(lineSubtotal);
                if (candidateDiscount.compareTo(bestDiscounts.get(line.productId())) > 0) {
                    bestDiscounts.put(line.productId(), candidateDiscount);
                }
            }
        }
        return bestDiscounts;
    }

    private Map<Long, Set<Long>> loadEligibleProductIdsByPromotion(
            List<Promotion> promotions,
            Set<Long> productIds) {
        if (productIds.isEmpty()) return Map.of();
        Map<Long, Set<Long>> eligibleProductIdsByPromotion = new HashMap<>();
        for (Promotion promotion : promotions) {
            if (promotion.getId() == null) continue;
            Set<Long> eligibleProductIds = promotionProductRepository
                    .findByPromotion_IdAndProduct_IdIn(promotion.getId(), productIds)
                    .stream()
                    .map(link -> link.getProduct().getId())
                    .collect(java.util.stream.Collectors.toSet());
            eligibleProductIdsByPromotion.put(promotion.getId(), eligibleProductIds);
        }
        return eligibleProductIdsByPromotion;
    }

    private List<PosCatalogPriceResponse> getPosCatalogPrices(
            List<PromotionLine> cartLines,
            List<Long> requestedProductIds) {
        if (requestedProductIds == null || requestedProductIds.isEmpty()) {
            return List.of();
        }
        List<Long> productIds = requestedProductIds.stream()
                .filter(java.util.Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
        if (productIds.isEmpty()) return List.of();

        Map<Long, Product> productsById = new HashMap<>();
        productRepository.findAllById(productIds)
                .forEach(product -> productsById.put(product.getId(), product));
        List<Promotion> promotions = promotionRepository.findAll();
        Set<Long> linkedProductIds = new TreeSet<>(productsById.keySet());
        cartLines.stream().map(PromotionLine::productId).forEach(linkedProductIds::add);
        Map<Long, Set<Long>> eligibleProductIdsByPromotion =
                loadEligibleProductIdsByPromotion(promotions, linkedProductIds);

        List<PosCatalogPriceResponse> prices = new ArrayList<>();
        for (Long productId : productIds) {
            Product product = productsById.get(productId);
            if (product == null
                    || !Boolean.TRUE.equals(product.getStatus())
                    || product.getQuantity() == null
                    || product.getQuantity() <= 0) {
                continue;
            }
            BigDecimal originalPrice = requireMoneyValue(
                    product.getPrice(),
                    "Sản phẩm có giá không hợp lệ"
            );
            List<PromotionLine> candidateLines = new ArrayList<>(cartLines);
            int candidateQuantity = 1;
            for (int index = 0; index < candidateLines.size(); index++) {
                PromotionLine line = candidateLines.get(index);
                if (line.productId().equals(productId)) {
                    candidateQuantity = Math.addExact(line.quantity(), 1);
                    candidateLines.set(index, new PromotionLine(
                            productId,
                            product.getName(),
                            candidateQuantity,
                            originalPrice
                    ));
                    break;
                }
            }
            if (candidateLines.stream().noneMatch(
                    line -> line.productId().equals(productId))) {
                candidateLines.add(new PromotionLine(
                        productId,
                        product.getName(),
                        candidateQuantity,
                        originalPrice
                ));
            }

            BigDecimal discount = calculateBestProductPromotionDiscounts(
                    candidateLines,
                    promotions,
                    eligibleProductIdsByPromotion
            ).getOrDefault(productId, BigDecimal.ZERO);
            BigDecimal salePrice = originalPrice
                    .multiply(BigDecimal.valueOf(candidateQuantity))
                    .subtract(discount)
                    .divide(BigDecimal.valueOf(candidateQuantity), 2, RoundingMode.HALF_UP);
            prices.add(new PosCatalogPriceResponse(productId, originalPrice, salePrice));
        }
        return prices;
    }

    private OrderAmounts calculateOrderAmounts(
            List<PromotionLine> lines,
            String promotionCode) {
        Promotion promotion = null;
        if (promotionCode != null && !promotionCode.isBlank()) {
            String normalizedCode = promotionCode.trim();
            promotion = promotionRepository.findByPromotionCodeIgnoreCase(normalizedCode)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Mã khuyến mãi không tồn tại"
                    ));
        }
        return calculateOrderAmounts(lines, promotion);
    }

    private OrderAmounts calculateOrderAmounts(
            List<PromotionLine> lines,
            Promotion promotion) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<Long, BigDecimal> lineDiscounts = new LinkedHashMap<>();
        for (PromotionLine line : lines) {
            if (line.quantity() == null || line.quantity() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Số lượng sản phẩm phải lớn hơn 0"
                );
            }
            BigDecimal unitPrice = requireMoneyValue(
                    line.unitPrice(),
                    "Đơn giá sản phẩm không hợp lệ"
            );
            totalAmount = totalAmount.add(
                    unitPrice.multiply(BigDecimal.valueOf(line.quantity()))
            );
            lineDiscounts.put(line.productId(), BigDecimal.ZERO);
        }

        if (promotion == null) {
            return new OrderAmounts(
                    totalAmount,
                    BigDecimal.ZERO,
                    null,
                    lineDiscounts
            );
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!Boolean.TRUE.equals(promotion.getStatus())
                || promotion.getStartDate() == null
                || promotion.getEndDate() == null
                || today.isBefore(promotion.getStartDate())
                || today.isAfter(promotion.getEndDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khuyến mãi chưa hoạt động hoặc đã hết hạn"
            );
        }
        BigDecimal discountPercent = promotion.getDiscountPercent();
        BigDecimal minimumOrderValue = promotion.getMinOrderValue();
        BigDecimal maximumDiscount = promotion.getMaxDiscount();
        if (discountPercent == null
                || discountPercent.signum() <= 0
                || discountPercent.compareTo(new BigDecimal("100")) > 0
                || (minimumOrderValue != null && minimumOrderValue.signum() < 0)
                || (maximumDiscount != null && maximumDiscount.signum() < 0)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Thông tin khuyến mãi không hợp lệ"
            );
        }
        if (minimumOrderValue != null
                && totalAmount.compareTo(minimumOrderValue) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã khuyến mãi"
            );
        }

        Set<Long> productIds = lines.stream()
                .map(PromotionLine::productId)
                .collect(java.util.stream.Collectors.toSet());
        Set<Long> eligibleProductIds = promotionProductRepository
                .findByPromotion_IdAndProduct_IdIn(promotion.getId(), productIds)
                .stream()
                .map(promotionProduct -> promotionProduct.getProduct().getId())
                .collect(java.util.stream.Collectors.toSet());
        List<PromotionLine> eligibleLines = lines.stream()
                .filter(line -> eligibleProductIds.contains(line.productId()))
                .toList();
        if (eligibleLines.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã khuyến mãi không áp dụng cho sản phẩm trong đơn hàng"
            );
        }

        BigDecimal eligibleAmount = eligibleLines.stream()
                .map(PromotionLine::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discountAmount = eligibleAmount
                .multiply(discountPercent)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        if (maximumDiscount != null) {
            discountAmount = discountAmount.min(maximumDiscount);
        }
        discountAmount = discountAmount.min(eligibleAmount);

        if (discountAmount.signum() > 0) {
            BigDecimal allocated = BigDecimal.ZERO;
            for (int index = 0; index < eligibleLines.size(); index++) {
                PromotionLine line = eligibleLines.get(index);
                BigDecimal lineDiscount;
                if (index == eligibleLines.size() - 1) {
                    lineDiscount = discountAmount.subtract(allocated);
                } else {
                    lineDiscount = line.subtotal()
                            .multiply(discountAmount)
                            .divide(eligibleAmount, 2, RoundingMode.DOWN)
                            .min(line.subtotal());
                    allocated = allocated.add(lineDiscount);
                }
                lineDiscounts.put(line.productId(), lineDiscount);
            }
        }

        return new OrderAmounts(totalAmount, discountAmount, promotion, lineDiscounts);
    }

    private String promotionIneligibilityMessage(
            Promotion promotion,
            BigDecimal totalAmount,
            ResponseStatusException exception) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!Boolean.TRUE.equals(promotion.getStatus())) {
            return "Chương trình khuyến mãi đang tạm dừng.";
        }
        if (promotion.getStartDate() != null && today.isBefore(promotion.getStartDate())) {
            return "Chương trình chưa bắt đầu.";
        }
        if (promotion.getEndDate() != null && today.isAfter(promotion.getEndDate())) {
            return "Chương trình đã hết hạn.";
        }
        BigDecimal minimumOrderValue = promotion.getMinOrderValue();
        if (minimumOrderValue != null
                && totalAmount.compareTo(minimumOrderValue) < 0) {
            BigDecimal remaining = minimumOrderValue.subtract(totalAmount);
            return "Đơn hàng cần thêm "
                    + remaining.stripTrailingZeros().toPlainString()
                    + "đ để đạt mức tối thiểu.";
        }
        if (exception.getReason() != null
                && exception.getReason().contains("không áp dụng cho sản phẩm")) {
            return "Khuyến mãi không áp dụng cho sản phẩm trong giỏ hàng.";
        }
        return "Ưu đãi hiện chưa đủ điều kiện áp dụng cho đơn hàng này.";
    }

    private OrderQuoteResponse toQuoteResponse(
            List<PromotionLine> lines,
            OrderAmounts amounts) {
        List<OrderQuoteItemResponse> itemResponses = lines.stream()
                .map(line -> {
                    BigDecimal itemDiscount = amounts.lineDiscounts()
                            .getOrDefault(line.productId(), BigDecimal.ZERO);
                    return new OrderQuoteItemResponse(
                            line.productId(),
                            line.productName(),
                            line.quantity(),
                            line.unitPrice(),
                            itemDiscount,
                            line.subtotal().subtract(itemDiscount)
                    );
                })
                .toList();
        return new OrderQuoteResponse(
                amounts.totalAmount(),
                amounts.discountAmount(),
                amounts.totalAmount().subtract(amounts.discountAmount()),
                amounts.promotion() == null
                        ? null
                        : amounts.promotion().getPromotionCode(),
                itemResponses
        );
    }

    private void restoreReservedStock(List<OrderItem> orderItems) {
        Set<Long> productIds = new TreeSet<>();
        orderItems.forEach(item -> productIds.add(item.getProduct().getId()));
        List<Product> lockedProducts = productRepository.findAllByIdForUpdate(
                new ArrayList<>(productIds)
        );
        Map<Long, Product> productsById = new HashMap<>();
        lockedProducts.forEach(product -> productsById.put(product.getId(), product));
        for (OrderItem item : orderItems) {
            Long productId = item.getProduct().getId();
            Product product = productsById.get(productId);
            if (product == null) {
                throw notFound("Không tìm thấy sản phẩm", productId);
            }
            adjustStock(product, item.getQuantity());
        }
        productRepository.saveAll(lockedProducts);
    }

    private void adjustStock(Product product, int quantityChange) {
        Integer stock = product.getQuantity();
        if (stock == null || stock < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tồn kho sản phẩm không hợp lệ: " + product.getId()
            );
        }
        try {
            int adjustedStock = Math.addExact(stock, quantityChange);
            if (adjustedStock < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Sản phẩm không đủ tồn kho: " + product.getName()
                );
            }
            product.setQuantity(adjustedStock);
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Số lượng tồn kho vượt giới hạn của sản phẩm: " + product.getName()
            );
        }
    }

    private void validateUniqueProducts(List<CreateOrderItemRequest> items) {
        Set<Long> productIds = new HashSet<>();
        for (CreateOrderItemRequest item : items) {
            if (!productIds.add(item.productId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Một productId không được xuất hiện nhiều lần trong cùng đơn"
                );
            }
        }
    }

    private void validateItems(List<CreateOrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Đơn hàng phải có ít nhất một dòng sản phẩm"
            );
        }
        for (CreateOrderItemRequest item : items) {
            if (item == null || item.productId() == null || item.productId() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Mỗi dòng hàng phải có productId hợp lệ"
                );
            }
            if (item.quantity() == null || item.quantity() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Số lượng mỗi sản phẩm phải lớn hơn 0"
                );
            }
        }
        validateUniqueProducts(items);
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void validateRequest(CreateOrderRequest request) {
        if (request == null || request.customerId() == null || request.employeeId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "customerId và employeeId là bắt buộc"
            );
        }
        if (request.customerId() <= 0 || request.employeeId() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "customerId và employeeId phải lớn hơn 0"
            );
        }
        if (request.deliveryAddress() != null && request.deliveryAddress().length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Địa chỉ giao hàng không được vượt quá 255 ký tự"
            );
        }
        if (request.note() != null && request.note().length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ghi chú đơn hàng không được vượt quá 500 ký tự"
            );
        }
        if (request.loyaltyPointsToRedeem() != null
                && request.loyaltyPointsToRedeem() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điểm sử dụng không được âm"
            );
        }
        if (!Boolean.TRUE.equals(request.applyProductPromotions())
                && request.loyaltyPointsToRedeem() != null
                && request.loyaltyPointsToRedeem() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ đơn POS mới được sử dụng điểm tích lũy"
            );
        }
        if (Boolean.TRUE.equals(request.applyProductPromotions())
                && request.promotionCode() != null
                && !request.promotionCode().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "POS không hỗ trợ nhập mã khuyến mãi"
            );
        }
        validateItems(request.items());
    }

    private Order findOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> notFound("Không tìm thấy đơn hàng", id));
    }

    private OrderResponse toResponse(Order order, List<OrderItem> orderItems) {
        BigDecimal totalAmount = requireMoneyValue(
                order.getTotalAmount(),
                "Tổng tiền đơn hàng không hợp lệ"
        );
        BigDecimal discountAmount = requireMoneyValue(
                order.getDiscountAmount(),
                "Tiền giảm giá đơn hàng không hợp lệ"
        );
        if (discountAmount.compareTo(totalAmount) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tiền giảm giá không được lớn hơn tổng tiền đơn hàng"
            );
        }

        return orderMapper.toResponse(
                order,
                orderItems,
                totalAmount.subtract(discountAmount)
        );
    }

    private List<OrderResponse> toResponses(List<Order> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }

        List<Long> orderIds = orders.stream()
                .map(Order::getId)
                .toList();
        Map<Long, List<OrderItem>> itemsByOrderId = new HashMap<>();
        for (OrderItem item : orderItemRepository.findByOrder_IdIn(orderIds)) {
            if (item.getOrder() == null || item.getOrder().getId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Chi tiết đơn hàng không liên kết với đơn hàng hợp lệ"
                );
            }
            itemsByOrderId.computeIfAbsent(item.getOrder().getId(), ignored -> new ArrayList<>())
                    .add(item);
        }

        return orders.stream()
                .map(order -> toResponse(order, itemsByOrderId.getOrDefault(order.getId(), List.of())))
                .toList();
    }

    private OrderItem findOrderItemById(Long id) {
        return orderItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy chi tiết đơn hàng với ID: " + id
                ));
    }

    private Order findParentOrder(OrderItem orderItem) {
        if (orderItem.getOrder() == null || orderItem.getOrder().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chi tiết đơn hàng không liên kết với đơn hàng hợp lệ"
            );
        }

        Long orderId = orderItem.getOrder().getId();
        return orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không tìm thấy đơn hàng cha của chi tiết đơn hàng"
                ));
    }

    private void recalculateOrderTotal(Order order) {
        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(order.getId());
        if (order.getPromotion() == null) {
            recalculateWithoutPromotion(order, orderItems);
            return;
        }

        List<PromotionLine> lines = orderItems.stream()
                .map(item -> new PromotionLine(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        requireMoneyValue(
                                item.getUnitPrice(),
                                "Đơn hàng có chi tiết không có đơn giá hợp lệ"
                        )
                ))
                .toList();
        OrderAmounts amounts = calculateOrderAmounts(lines, order.getPromotion());
        for (OrderItem item : orderItems) {
            BigDecimal itemDiscount = amounts.lineDiscounts()
                    .getOrDefault(item.getProduct().getId(), BigDecimal.ZERO);
            item.setDiscountAmount(itemDiscount);
            item.setLineTotal(
                    item.getUnitPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity()))
                            .subtract(itemDiscount)
            );
        }
        order.setTotalAmount(amounts.totalAmount());
        order.setDiscountAmount(amounts.discountAmount());
        orderItemRepository.saveAll(orderItems);
        orderRepository.saveAndFlush(order);
    }

    private void recalculateWithoutPromotion(Order order, List<OrderItem> orderItems) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItem item : orderItems) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Đơn hàng có chi tiết với số lượng không hợp lệ"
                );
            }
            BigDecimal unitPrice = requireMoneyValue(
                    item.getUnitPrice(),
                    "Đơn hàng có chi tiết không có đơn giá hợp lệ"
            );
            BigDecimal itemDiscount = item.getDiscountAmount() == null
                    ? BigDecimal.ZERO
                    : requireMoneyValue(
                            item.getDiscountAmount(),
                            "Tiền giảm của chi tiết đơn hàng không hợp lệ"
                    );
            BigDecimal subtotal = unitPrice.multiply(
                    BigDecimal.valueOf(item.getQuantity())
            );
            if (itemDiscount.compareTo(subtotal) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tiền giảm của chi tiết đơn hàng lớn hơn thành tiền trước giảm"
                );
            }
            item.setLineTotal(subtotal.subtract(itemDiscount));
            totalAmount = totalAmount.add(subtotal);
        }

        BigDecimal discountAmount = requireMoneyValue(
                order.getDiscountAmount(),
                "Tiền giảm giá đơn hàng không hợp lệ"
        );
        if (discountAmount.compareTo(totalAmount) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tổng tiền sau cập nhật không thể nhỏ hơn tiền giảm giá đơn hàng"
            );
        }
        order.setTotalAmount(totalAmount);
        orderItemRepository.saveAll(orderItems);
        orderRepository.saveAndFlush(order);
    }

    private void ensureOrderItemsEditable(Order order) {
        if (!"PENDING".equals(order.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ có thể thay đổi chi tiết khi đơn hàng ở trạng thái PENDING"
            );
        }
        if (paymentRepository.existsByOrder_Id(order.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể thay đổi chi tiết của đơn hàng đã có thông tin thanh toán"
            );
        }
        if (!order.isStockReserved()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn hàng cũ chưa giữ tồn kho; hãy hủy và tạo lại đơn để chỉnh sửa an toàn"
            );
        }
        if (order.getPromotion() == null) {
            BigDecimal orderDiscount = order.getDiscountAmount() == null
                    ? BigDecimal.ZERO
                    : order.getDiscountAmount();
            boolean hasProductDiscount = orderItemRepository.findByOrder_Id(order.getId())
                    .stream()
                    .anyMatch(item -> item.getDiscountAmount() != null
                            && item.getDiscountAmount().signum() > 0);
            if (orderDiscount.signum() > 0 || hasProductDiscount) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không thể chỉnh sửa đơn đã áp dụng giá khuyến mãi hoặc đổi điểm; hãy hủy và tạo lại đơn"
                );
            }
        }
    }

    private void requireConfirmedOrder(Order order) {
        if (!"CONFIRMED".equals(order.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ đơn hàng đã xác nhận mới được cập nhật trạng thái giao hàng"
            );
        }
    }

    private void requireSuccessfulPayment(Long orderId) {
        boolean paid = paymentRepository.findByOrder_IdForUpdate(orderId)
                .map(payment -> "SUCCESS".equals(payment.getStatus()))
                .orElse(false);
        if (!paid) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ đơn đã thanh toán thành công mới được giao hoặc hoàn tất"
            );
        }
    }

    private BigDecimal requireMoneyValue(BigDecimal amount, String message) {
        if (amount == null || amount.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
        return amount;
    }

    private void requireActive(Boolean status, String resourceName) {
        if (!Boolean.TRUE.equals(status)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    resourceName + " không ở trạng thái hoạt động"
            );
        }
    }

    private ResponseStatusException notFound(String resourceName, Long id) {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                resourceName + " với ID " + id + " không tồn tại"
        );
    }

    private record PromotionLine(
            Long productId,
            String productName,
            Integer quantity,
            BigDecimal unitPrice) {
        private BigDecimal subtotal() {
            return unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    private record OrderAmounts(
            BigDecimal totalAmount,
            BigDecimal discountAmount,
            Promotion promotion,
            Map<Long, BigDecimal> lineDiscounts) {
    }

    private record PosOrderAmounts(
            BigDecimal totalAmount,
            BigDecimal productDiscountAmount,
            BigDecimal subtotalAfterPromotions,
            int loyaltyPointsToRedeem,
            BigDecimal loyaltyDiscountAmount,
            BigDecimal finalAmount,
            Map<Long, BigDecimal> lineDiscounts) {
    }
}