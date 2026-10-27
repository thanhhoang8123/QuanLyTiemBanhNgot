package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CreateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CustomOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.UpdateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.UpdateCustomOrderStatusRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.CustomOrder;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.CustomOrderMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.CustomOrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Service xử lý đơn bánh đặt theo yêu cầu riêng.
 */
@Service
public class CustomOrderService {

    private final CustomOrderRepository customOrderRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomOrderMapper customOrderMapper;

    public CustomOrderService(
            CustomOrderRepository customOrderRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            CustomOrderMapper customOrderMapper) {
        this.customOrderRepository = customOrderRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.customOrderMapper = customOrderMapper;
    }

    @Transactional(readOnly = true)
    public List<CustomOrderResponse> findAll() {
        return customOrderRepository.findAll().stream()
                .map(customOrderMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomOrderResponse findById(Long id) {
        return customOrderRepository.findById(id)
                .map(customOrderMapper::toResponse)
                .orElseThrow(() -> notFound(id));
    }

    @Transactional
    public CustomOrderResponse create(CreateCustomOrderRequest request) {
        validateRequest(request, true); // true nghĩa là yêu cầu có employeeId (dành cho nhân viên tạo)
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        validateDeliveryDate(request.deliveryDate(), now);
        validateDeposit(request.estimatedPrice(), request.deposit());

        Customer customer = findActiveCustomer(request.customerId());
        Employee employee = findActiveEmployee(request.employeeId());
        
        CustomOrder customOrder = customOrderMapper.toEntity(request, customer, employee);
        customOrder.setOrderDate(now);
        customOrder.setStatus("PENDING");

        return customOrderMapper.toResponse(customOrderRepository.save(customOrder));
    }

    /**
     * Khách hàng tự đặt đơn (không bắt buộc employeeId lúc gửi request, hoặc hệ thống tự xử lý)
     */
    @Transactional
    public CustomOrderResponse createForAuthenticatedCustomer(
            CreateCustomOrderRequest request,
            String username) {
        
        // Tìm thông tin khách hàng dựa vào tài khoản đang đăng nhập
        Customer currentCustomer = customerRepository.findByAccount_UsernameAndStatusTrue(username)
                .orElseThrow(() -> new ConflictException(
                        "Tài khoản đăng nhập chưa được liên kết với hồ sơ khách hàng đang hoạt động"
                ));

        if (request == null || !currentCustomer.getId().equals(request.customerId())) {
            throw new ConflictException(
                    "Chỉ được tạo đơn bằng hồ sơ khách hàng của tài khoản đang đăng nhập"
            );
        }

        // Validate request nhưng KHÔNG bắt buộc employeeId vì khách tự đặt
        validateRequest(request, false); 
        
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        validateDeliveryDate(request.deliveryDate(), now);
        validateDeposit(request.estimatedPrice(), request.deposit());

        Customer customer = findActiveCustomer(request.customerId());
        
        // Nếu khách tự đặt, employee có thể để null hoặc gán nhân viên phụ trách mặc định (tuỳ nghiệp vụ)
        Employee employee = null;
        if (request.employeeId() != null) {
            employee = findActiveEmployee(request.employeeId());
        }

        CustomOrder customOrder = customOrderMapper.toEntity(request, customer, employee);
        customOrder.setOrderDate(now);
        customOrder.setStatus("PENDING"); // Đơn do khách tự đặt cũng ở trạng thái chờ xác nhận

        return customOrderMapper.toResponse(customOrderRepository.save(customOrder));
    }

    @Transactional
    public CustomOrderResponse createForAuthenticatedEmployee(
            CreateCustomOrderRequest request,
            String username) {
        Employee currentEmployee = employeeRepository.findByAccount_UsernameAndStatusTrue(username)
                .orElseThrow(() -> new ConflictException(
                        "Tài khoản đăng nhập chưa được liên kết với hồ sơ nhân viên đang hoạt động"
                ));
        if (request == null || !currentEmployee.getId().equals(request.employeeId())) {
            throw new ConflictException(
                    "Chỉ được tạo đơn bằng hồ sơ nhân viên của tài khoản đang đăng nhập"
            );
        }
        return create(request);
    }

    @Transactional
    public CustomOrderResponse update(Long id, UpdateCustomOrderRequest request) {
        validateRequest(request);
        CustomOrder customOrder = findEntityByIdForUpdate(id);
        if ("COMPLETED".equals(customOrder.getStatus())
                || "CANCELLED".equals(customOrder.getStatus())) {
            throw new ConflictException(
                    "Không thể chỉnh sửa đơn hàng đã hoàn thành hoặc đã hủy"
            );
        }

        validateDeliveryDate(request.deliveryDate(), LocalDateTime.now(ZoneOffset.UTC));
        validateDeposit(request.estimatedPrice(), request.deposit());
        Customer customer = findActiveCustomer(request.customerId());
        Employee employee = request.employeeId() != null ? findActiveEmployee(request.employeeId()) : null;
        
        customOrderMapper.updateEntity(request, customer, employee, customOrder);
        return customOrderMapper.toResponse(customOrderRepository.save(customOrder));
    }

    @Transactional
    public CustomOrderResponse updateStatus(
            Long id,
            UpdateCustomOrderStatusRequest request) {
        CustomOrder customOrder = findEntityByIdForUpdate(id);
        String currentStatus = customOrder.getStatus();
        String targetStatus = request == null ? null : request.status();
        if (!isKnownStatus(targetStatus)) {
            throw new BadRequestException(
                    "Trạng thái phải là PENDING, CONFIRMED, IN_PROGRESS, COMPLETED hoặc CANCELLED"
            );
        }
        if (!isAllowedTransition(currentStatus, targetStatus)) {
            throw new ConflictException(
                    "Không thể chuyển trạng thái đơn từ "
                            + currentStatus + " sang " + targetStatus
            );
        }
        customOrder.setStatus(targetStatus);
        return customOrderMapper.toResponse(customOrderRepository.save(customOrder));
    }

    @Transactional
    public void deleteById(Long id) {
        CustomOrder customOrder = findEntityByIdForUpdate(id);
        if (!"PENDING".equals(customOrder.getStatus())) {
            throw new ConflictException(
                    "Chỉ được xóa đơn đặt bánh đang ở trạng thái PENDING"
            );
        }
        customOrderRepository.delete(customOrder);
    }

    private CustomOrder findEntityByIdForUpdate(Long id) {
        return customOrderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> notFound(id));
    }

    private Customer findActiveCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khách hàng với ID: " + customerId
                ));
        if (!Boolean.TRUE.equals(customer.getStatus())) {
            throw new ConflictException("Khách hàng không ở trạng thái hoạt động");
        }
        return customer;
    }

    private Employee findActiveEmployee(Long employeeId) {
        if (employeeId == null) return null;
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy nhân viên với ID: " + employeeId
                ));
        if (!Boolean.TRUE.equals(employee.getStatus())) {
            throw new ConflictException("Nhân viên không ở trạng thái hoạt động");
        }
        return employee;
    }

    private void validateRequest(CreateCustomOrderRequest request) {
        validateRequest(request, true);
    }

    private void validateRequest(CreateCustomOrderRequest request, boolean requireEmployee) {
        validateRequest(
                request == null ? null : request.customerId(),
                request == null ? null : request.employeeId(),
                request == null ? null : request.cakeName(),
                request == null ? null : request.requestDescription(),
                request == null ? null : request.deliveryDate(),
                request == null ? null : request.estimatedPrice(),
                request == null ? null : request.deposit(),
                requireEmployee
        );
    }

    private void validateRequest(UpdateCustomOrderRequest request) {
        validateRequest(
                request == null ? null : request.customerId(),
                request == null ? null : request.employeeId(),
                request == null ? null : request.cakeName(),
                request == null ? null : request.requestDescription(),
                request == null ? null : request.deliveryDate(),
                request == null ? null : request.estimatedPrice(),
                request == null ? null : request.deposit(),
                false // Cập nhật có thể không bắt buộc employee ngay
        );
    }

    private void validateRequest(
            Long customerId,
            Long employeeId,
            String cakeName,
            String requestDescription,
            LocalDateTime deliveryDate,
            BigDecimal estimatedPrice,
            BigDecimal deposit,
            boolean requireEmployee) {
        
        if (customerId == null || customerId <= 0
                || (requireEmployee && (employeeId == null || employeeId <= 0))
                || cakeName == null || cakeName.isBlank() || cakeName.length() > 150
                || deliveryDate == null
                || !isValidMoney(estimatedPrice) || estimatedPrice.signum() <= 0
                || !isValidMoney(deposit) || deposit.signum() < 0) {
            throw new BadRequestException("Thông tin đơn đặt bánh không hợp lệ");
        }
        if (requestDescription != null
                && requestDescription.getBytes(StandardCharsets.UTF_8).length > 65_535) {
            throw new BadRequestException(
                    "Mô tả yêu cầu vượt quá giới hạn của cột dữ liệu"
            );
        }
    }

    private boolean isValidMoney(BigDecimal amount) {
        return amount != null
                && amount.scale() <= 2
                && amount.compareTo(new BigDecimal("9999999999999.99")) <= 0
                && amount.compareTo(new BigDecimal("-9999999999999.99")) >= 0;
    }

    private void validateDeliveryDate(LocalDateTime deliveryDate, LocalDateTime now) {
        if (!deliveryDate.isAfter(now)) {
            throw new BadRequestException(
                    "Ngày giao bánh phải sau thời điểm đặt hoặc cập nhật đơn"
            );
        }
    }

    private void validateDeposit(BigDecimal estimatedPrice, BigDecimal deposit) {
        if (deposit.compareTo(estimatedPrice) > 0) {
            throw new BadRequestException(
                    "Tiền cọc không được lớn hơn giá dự kiến"
            );
        }
    }

    private boolean isAllowedTransition(String currentStatus, String targetStatus) {
        if (currentStatus == null || targetStatus == null) {
            return false;
        }
        return switch (currentStatus) {
            case "PENDING" -> "CONFIRMED".equals(targetStatus)
                    || "CANCELLED".equals(targetStatus);
            case "CONFIRMED" -> "IN_PROGRESS".equals(targetStatus)
                    || "CANCELLED".equals(targetStatus);
            case "IN_PROGRESS" -> "COMPLETED".equals(targetStatus);
            default -> false;
        };
    }

    private boolean isKnownStatus(String status) {
        return "PENDING".equals(status)
                || "CONFIRMED".equals(status)
                || "IN_PROGRESS".equals(status)
                || "COMPLETED".equals(status)
                || "CANCELLED".equals(status);
    }

    private ResourceNotFoundException notFound(Long id) {
        return new ResourceNotFoundException(
                "Không tìm thấy đơn đặt bánh với ID: " + id
        );
    }
}