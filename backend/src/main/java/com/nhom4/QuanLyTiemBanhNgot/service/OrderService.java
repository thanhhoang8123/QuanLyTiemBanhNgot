package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderItemRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.CreateOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderItemUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteItemResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderQuoteResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.order.OrderUpdateRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.entity.Order;
import com.nhom4.QuanLyTiemBanhNgot.entity.OrderItem;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.mapper.OrderMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentRepository;
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

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
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
    public OrderQuoteResponse quote(OrderQuoteRequest request) {
        validateItems(request == null ? null : request.items());
        Map<Long, Product> productsById = loadProducts(request.items(), false);
        List<PromotionLine> lines = promotionLines(request.items(), productsById);
        OrderAmounts amounts = calculateOrderAmounts(lines, request.promotionCode());
        return toQuoteResponse(lines, amounts);
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

        validateUniqueProducts(request.items());
        Map<Long, Product> productsById = loadProducts(request.items(), true);
        List<PromotionLine> lines = promotionLines(request.items(), productsById);
        OrderAmounts amounts = calculateOrderAmounts(lines, request.promotionCode());

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
        order.setTotalAmount(amounts.totalAmount());
        order.setDiscountAmount(amounts.discountAmount());
        order.setPromotion(amounts.promotion());
        order.setPromotionCodeSnapshot(
                amounts.promotion() == null ? null : amounts.promotion().getPromotionCode()
        );
        order.setNote(normalizeOptionalText(request.note()));
        order.setStockReserved(true);

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
            BigDecimal itemDiscount = amounts.lineDiscounts()
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
        orderConfirmationEmailService.sendOrderConfirmation(order, savedItems);
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
}