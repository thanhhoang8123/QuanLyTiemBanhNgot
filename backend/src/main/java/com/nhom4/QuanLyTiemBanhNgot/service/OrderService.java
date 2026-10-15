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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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
    private final OrderMapper orderMapper;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            ProductRepository productRepository,
            PaymentRepository paymentRepository,
            OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.productRepository = productRepository;
        this.paymentRepository = paymentRepository;
        this.orderMapper = orderMapper;
    }

    /**
     * Lấy tất cả đơn hàng.
     *
     * findAll() được JpaRepository cung cấp sẵn.
     */
    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    /**
     * Tìm đơn hàng theo ID.
     *
     * Nếu không tìm thấy thì trả về null.
     */
    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElse(null);
    }

    /**
     * Lưu đơn và các dòng hàng trong cùng một transaction để không tạo đơn dở dang.
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

        Set<Long> productIds = new HashSet<>();
        for (CreateOrderItemRequest item : request.items()) {
            if (item == null || item.productId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Mỗi dòng hàng phải có productId"
                );
            }
            if (!productIds.add(item.productId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Một productId không được xuất hiện nhiều lần trong cùng đơn"
                );
            }
        }

        Map<Long, Product> productsById = new HashMap<>();
        productRepository.findAllById(productIds)
                .forEach(product -> productsById.put(product.getId(), product));

        for (Long productId : productIds) {
            if (!productsById.containsKey(productId)) {
                throw notFound("Không tìm thấy sản phẩm", productId);
            }
            requireActive(productsById.get(productId).getStatus(), "Sản phẩm");
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        String deliveryAddress = request.deliveryAddress();
        boolean requiresDelivery = deliveryAddress != null && !deliveryAddress.isBlank();

        Order order = orderMapper.toEntity(request, customer, employee);
        order.setDeliveryAddress(requiresDelivery ? deliveryAddress.trim() : null);
        order.setDeliveryStatus(requiresDelivery ? "PENDING" : "NOT_REQUIRED");
        order.setStatus("PENDING");
        order.setOrderDate(now);
        order.setCreatedAt(now);
        order.setDiscountAmount(BigDecimal.ZERO);

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
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateOrderItemRequest itemRequest : request.items()) {
            Product product = productsById.get(itemRequest.productId());
            BigDecimal unitPrice = product.getPrice();
            if (unitPrice == null || unitPrice.signum() < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Sản phẩm có giá không hợp lệ: " + product.getId()
                );
            }

            BigDecimal discountAmount = BigDecimal.ZERO;
            BigDecimal subtotal = unitPrice.multiply(
                    BigDecimal.valueOf(itemRequest.quantity())
            );
            BigDecimal lineTotal = subtotal.subtract(discountAmount);

            OrderItem orderItem = orderMapper.toEntity(
                    order,
                    product,
                    itemRequest,
                    unitPrice,
                    discountAmount,
                    lineTotal
            );
            orderItems.add(orderItem);
            // totalAmount là tổng trước giảm giá; lineTotal đã trừ giảm giá từng dòng.
            totalAmount = totalAmount.add(subtotal);
        }

        order.setTotalAmount(totalAmount);
        order = orderRepository.save(order);
        List<OrderItem> savedItems = orderItemRepository.saveAll(orderItems);
        BigDecimal finalAmount = totalAmount.subtract(order.getDiscountAmount());

        return orderMapper.toResponse(order, savedItems, finalAmount);
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
        BigDecimal unitPrice = requireMoneyValue(
                orderItem.getUnitPrice(),
                "Đơn giá của chi tiết đơn hàng không hợp lệ"
        );
        BigDecimal itemDiscount = orderItem.getDiscountAmount() == null
                ? BigDecimal.ZERO
                : requireMoneyValue(
                        orderItem.getDiscountAmount(),
                        "Tiền giảm của chi tiết đơn hàng không hợp lệ"
                );
        BigDecimal lineTotal = unitPrice
                .multiply(BigDecimal.valueOf(request.quantity()))
                .subtract(itemDiscount);
        if (lineTotal.signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tiền giảm của chi tiết đơn hàng lớn hơn thành tiền trước giảm"
            );
        }

        orderItem.setQuantity(request.quantity());
        orderItem.setLineTotal(lineTotal);
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
        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(order.getId());
        if (orderItems.size() <= 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa chi tiết cuối cùng của đơn hàng"
            );
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
        BigDecimal totalAmount = requireMoneyValue(
                order.getTotalAmount(),
                "Tổng tiền đơn hàng không hợp lệ"
        );
        BigDecimal discountAmount = requireMoneyValue(
                order.getDiscountAmount(),
                "Tiền giảm giá đơn hàng không hợp lệ"
        );
        BigDecimal finalAmount = totalAmount.subtract(discountAmount);
        return orderMapper.toResponse(order, orderItems, finalAmount);
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

    private void validateRequest(CreateOrderRequest request) {
        if (request == null || request.customerId() == null || request.employeeId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "customerId và employeeId là bắt buộc"
            );
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Đơn hàng phải có ít nhất một dòng sản phẩm"
            );
        }
        for (CreateOrderItemRequest item : request.items()) {
            if (item == null || item.quantity() == null || item.quantity() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Số lượng mỗi sản phẩm phải lớn hơn 0"
                );
            }
        }
    }

    private Order findOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> notFound("Không tìm thấy đơn hàng", id));
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
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không tìm thấy đơn hàng cha của chi tiết đơn hàng"
                ));
    }

    private void recalculateOrderTotal(Order order) {
        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(order.getId());
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

            // ERD định nghĩa totalAmount trước giảm; lineTotal lưu giá trị sau giảm của từng dòng.
            totalAmount = totalAmount.add(
                    unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()))
            );
        }

        order.setTotalAmount(totalAmount);
        orderRepository.saveAndFlush(order);
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
}