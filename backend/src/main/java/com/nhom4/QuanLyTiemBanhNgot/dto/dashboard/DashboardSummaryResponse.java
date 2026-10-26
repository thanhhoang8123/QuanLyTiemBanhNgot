package com.nhom4.QuanLyTiemBanhNgot.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardSummaryResponse(
        String period,
        BigDecimal paidRevenue,
        long paidOrderCount,
        BigDecimal averagePaidOrder,
        String topProduct,
        long topProductQuantity,
        List<SalesPoint> salesTrend,
        List<CategorySales> categorySales,
        List<LowStockItem> lowStockItems,
        List<RecentOrder> recentOrders
) {
    public record SalesPoint(LocalDate date, BigDecimal revenue) {}

    public record CategorySales(String category, BigDecimal revenue) {}

    public record LowStockItem(
            Long id,
            String name,
            BigDecimal quantity,
            String unit,
            BigDecimal minimum
    ) {}

    public record RecentOrder(
            Long id,
            String orderCode,
            String customerName,
            LocalDateTime orderDate,
            BigDecimal totalAmount,
            BigDecimal discountAmount,
            String status,
            String paymentStatus
    ) {}
}
