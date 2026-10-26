package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.dashboard.DashboardSummaryResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardSummaryResponse getSummary(
            @RequestParam(defaultValue = "week") String period,
            Authentication authentication) {
        if (!period.equalsIgnoreCase("today")
                && !period.equalsIgnoreCase("week")
                && !period.equalsIgnoreCase("month")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khoảng thời gian phải là today, week hoặc month"
            );
        }
        boolean includeInventory = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_MANAGER"));
        return dashboardService.getSummary(period, includeInventory);
    }
}
