
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderCreateRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import com.nhom4.QuanLyTiemBanhNgot.entity.PurchaseOrder;
import com.nhom4.QuanLyTiemBanhNgot.entity.PurchaseOrderItem;
import com.nhom4.QuanLyTiemBanhNgot.repository.IngredientRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PurchaseOrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PurchaseOrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.SupplierRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import com.nhom4.QuanLyTiemBanhNgot.validation.TV2ValidationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository repository;
    private final PurchaseOrderItemRepository itemRepository;
    private final IngredientRepository ingredientRepository;
    private final SupplierRepository supplierRepository;
    private final EmployeeRepository employeeRepository;
    private final ActivityLogService activityLogService;

    public PurchaseOrderService(
            PurchaseOrderRepository repository,
            PurchaseOrderItemRepository itemRepository,
            IngredientRepository ingredientRepository,
            SupplierRepository supplierRepository,
            EmployeeRepository employeeRepository,
            ActivityLogService activityLogService) {
        this.repository = repository;
        this.itemRepository = itemRepository;
        this.ingredientRepository = ingredientRepository;
        this.supplierRepository = supplierRepository;
        this.employeeRepository = employeeRepository;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse findById(Long id) {
        return toResponse(getOrder(id));
    }

    @Transactional
    public PurchaseOrderResponse create(PurchaseOrderCreateRequest request) {
        TV2ValidationUtils.validatePurchaseOrder(request);

        var supplier = supplierRepository.findByIdForUpdate(request.supplierId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy nhà cung cấp"));

        if (Boolean.FALSE.equals(supplier.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nhà cung cấp đã ngừng hoạt động");
        }

        TreeSet<Long> ingredientIds = new TreeSet<>();
        request.items().forEach(item -> ingredientIds.add(item.ingredientId()));
        List<Ingredient> lockedIngredients = ingredientRepository.findAllByIdForUpdate(
                new ArrayList<>(ingredientIds));
        Map<Long, Ingredient> ingredientsById = new HashMap<>();
        lockedIngredients.forEach(ingredient ->
                ingredientsById.put(ingredient.getId(), ingredient));
        if (ingredientsById.size() != ingredientIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Không tìm thấy nguyên liệu");
        }

        for (Ingredient ingredient : lockedIngredients) {
            if (Boolean.FALSE.equals(ingredient.getStatus())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Nguyên liệu đã ngừng hoạt động");
            }
        }

        LocalDateTime now = LocalDateTime.now();

        PurchaseOrder order = new PurchaseOrder();
        order.setPurchaseCode("PN" + now.format(
                DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS")));
        order.setSupplier(supplier);
        order.setEmployeeId(request.employeeId());
        order.setOrderDate(now);
        order.setStatus("PENDING");
        order.setTotalAmount(BigDecimal.ZERO.setScale(2));
        order.setCreatedAt(now);

        repository.save(order);

        BigDecimal total = BigDecimal.ZERO;

        for (PurchaseOrderCreateRequest.PurchaseOrderItemRequest itemRequest
                : request.items()) {
            Ingredient ingredient = ingredientsById.get(itemRequest.ingredientId());

            BigDecimal lineTotal = itemRequest.quantity()
                    .multiply(itemRequest.unitCost())
                    .setScale(2, RoundingMode.HALF_UP);

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(order);
            item.setIngredient(ingredient);
            item.setQuantity(itemRequest.quantity());
            item.setUnitCost(itemRequest.unitCost());
            item.setLineTotal(lineTotal);

            itemRepository.save(item);
            total = total.add(lineTotal);
        }

        order.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
        repository.save(order);

        activityLogService.recordPurchaseOrderStatusAfterCommit(
                order.getId(), null, "PENDING", "Tạo phiếu nhập hàng");

        return toResponse(order);
    }

    @Transactional
    public PurchaseOrderResponse createForAuthenticatedEmployee(
            PurchaseOrderCreateRequest request,
            String username) {
        var currentEmployee = employeeRepository.findByAccount_UsernameAndStatusTrue(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tài khoản đăng nhập chưa được liên kết với hồ sơ nhân viên đang hoạt động"));
        if (request == null || !currentEmployee.getId().equals(request.employeeId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Chỉ được tạo phiếu nhập bằng hồ sơ nhân viên của tài khoản đang đăng nhập");
        }
        return create(request);
    }

    @Transactional
    public PurchaseOrderResponse receive(Long id) {
        PurchaseOrder order = getOrderForUpdate(id);

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ được nhận hàng khi phiếu đang chờ xử lý");
        }

        List<PurchaseOrderItem> items =
                itemRepository.findByPurchaseOrder_Id(id);

        if (items.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Phiếu nhập chưa có nguyên liệu");
        }

        TreeSet<Long> ingredientIds = new TreeSet<>();
        for (PurchaseOrderItem item : items) {
            if (item.getIngredient() == null || item.getIngredient().getId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Chi tiết phiếu nhập không liên kết với nguyên liệu hợp lệ");
            }
            ingredientIds.add(item.getIngredient().getId());
        }

        List<Ingredient> lockedIngredients = ingredientRepository.findAllByIdForUpdate(
                new ArrayList<>(ingredientIds));
        Map<Long, Ingredient> ingredientsById = new HashMap<>();
        lockedIngredients.forEach(ingredient ->
                ingredientsById.put(ingredient.getId(), ingredient));

        Map<Long, BigDecimal> quantitiesByIngredient = new HashMap<>();
        for (PurchaseOrderItem item : items) {
            Long ingredientId = item.getIngredient().getId();
            Ingredient ingredient = ingredientsById.get(ingredientId);
            if (ingredient == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không tìm thấy nguyên liệu khi nhận hàng");
            }
            TV2ValidationUtils.validateReceiveItem(
                    ingredient, item.getQuantity());
            quantitiesByIngredient.merge(
                    ingredientId, item.getQuantity(), BigDecimal::add);
        }

        for (Ingredient ingredient : lockedIngredients) {
            BigDecimal receivedQuantity = quantitiesByIngredient.get(ingredient.getId());
            TV2ValidationUtils.validateReceiveItem(ingredient, receivedQuantity);
            BigDecimal currentStock = ingredient.getStockQuantity() == null
                    ? BigDecimal.ZERO
                    : ingredient.getStockQuantity();

            ingredient.setStockQuantity(
                    currentStock.add(receivedQuantity));
        }
        ingredientRepository.saveAll(lockedIngredients);

        String oldStatus = order.getStatus();
        order.setStatus("RECEIVED");
        repository.save(order);

        activityLogService.recordPurchaseOrderStatusAfterCommit(
                order.getId(), oldStatus, "RECEIVED",
                "Đã nhận hàng và cập nhật tồn kho");

        return toResponse(order);
    }

    @Transactional
    public PurchaseOrderResponse cancel(Long id) {
        PurchaseOrder order = getOrderForUpdate(id);

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ được hủy phiếu đang chờ xử lý");
        }

        String oldStatus = order.getStatus();
        order.setStatus("CANCELLED");
        repository.save(order);

        activityLogService.recordPurchaseOrderStatusAfterCommit(
                order.getId(), oldStatus, "CANCELLED", "Hủy phiếu nhập hàng");

        return toResponse(order);
    }

    private PurchaseOrder getOrder(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "ID phiếu nhập không hợp lệ");
        }

        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy phiếu nhập"));
    }

    private PurchaseOrder getOrderForUpdate(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "ID phiếu nhập không hợp lệ");
        }

        return repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy phiếu nhập"));
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder order) {
        List<PurchaseOrderResponse.ItemResponse> items =
                itemRepository.findByPurchaseOrder_Id(order.getId())
                        .stream()
                        .map(item -> new PurchaseOrderResponse.ItemResponse(
                                item.getIngredient().getId(),
                                item.getIngredient().getName(),
                                item.getQuantity(),
                                item.getUnitCost(),
                                item.getLineTotal()))
                        .toList();

        return new PurchaseOrderResponse(
                order.getId(),
                order.getPurchaseCode(),
                order.getSupplier() == null ? null : order.getSupplier().getId(),
                order.getSupplier() == null ? null : order.getSupplier().getName(),
                order.getEmployeeId(),
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(),
                items);
    }
}
