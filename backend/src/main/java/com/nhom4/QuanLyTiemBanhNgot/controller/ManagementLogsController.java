package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.document.ActivityLog;
import com.nhom4.QuanLyTiemBanhNgot.document.OrderStatusHistory;
import com.nhom4.QuanLyTiemBanhNgot.service.ActivityLogService;
import com.nhom4.QuanLyTiemBanhNgot.service.OrderStatusHistoryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/management/logs")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Validated
public class ManagementLogsController {
    private final ActivityLogService activityLogService;
    private final OrderStatusHistoryService orderStatusHistoryService;

    public ManagementLogsController(
            ActivityLogService activityLogService,
            OrderStatusHistoryService orderStatusHistoryService) {
        this.activityLogService = activityLogService;
        this.orderStatusHistoryService = orderStatusHistoryService;
    }

    @GetMapping("/activity")
    public List<ActivityLog> getActivityLogs(
            @RequestParam(defaultValue = "100") @Min(1) @Max(200) int limit) {
        return activityLogService.findRecent(limit);
    }

    @GetMapping("/order-status")
    public List<OrderStatusHistory> getOrderStatusHistory(
            @RequestParam(defaultValue = "100") @Min(1) @Max(200) int limit) {
        return orderStatusHistoryService.findRecent(limit);
    }
}
