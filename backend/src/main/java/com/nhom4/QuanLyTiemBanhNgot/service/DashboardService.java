package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.dashboard.DashboardSummaryResponse;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.YearMonth;
import java.util.List;

@Service
public class DashboardService {

    private final EntityManager entityManager;

    public DashboardService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(String period, boolean includeInventory) {
        DateRange range = DateRange.forPeriod(period, LocalDate.now(ZoneOffset.UTC));
        Object[] totals = (Object[]) entityManager.createNativeQuery("""
                select coalesce(sum(pm.amount), 0), count(*)
                from payments pm
                join orders o on o.id = pm.order_id
                where pm.status = 'SUCCESS'
                  and o.status <> 'CANCELLED'
                  and pm.paid_at >= :start and pm.paid_at < :end
                """)
                .setParameter("start", range.start().atStartOfDay())
                .setParameter("end", range.endExclusive().atStartOfDay())
                .getSingleResult();
        BigDecimal revenue = money(totals[0]);
        long paidOrderCount = ((Number) totals[1]).longValue();
        BigDecimal averagePaidOrder = paidOrderCount == 0
                ? BigDecimal.ZERO
                : revenue.divide(BigDecimal.valueOf(paidOrderCount), 2, java.math.RoundingMode.HALF_UP);

        List<DashboardSummaryResponse.SalesPoint> trend = salesTrend(range);
        List<DashboardSummaryResponse.CategorySales> categories = categorySales(range);
        List<DashboardSummaryResponse.LowStockItem> lowStockItems = includeInventory
                ? lowStockItems()
                : List.of();
        List<DashboardSummaryResponse.RecentOrder> recentOrders = recentOrders();
        Object[] topProduct = topProduct(range);

        return new DashboardSummaryResponse(
                range.label(),
                revenue,
                paidOrderCount,
                averagePaidOrder,
                topProduct == null ? null : (String) topProduct[0],
                topProduct == null ? 0L : ((Number) topProduct[1]).longValue(),
                trend,
                categories,
                lowStockItems,
                recentOrders
        );
    }

    private List<DashboardSummaryResponse.SalesPoint> salesTrend(DateRange range) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                select date(pm.paid_at), coalesce(sum(pm.amount), 0)
                from payments pm
                join orders o on o.id = pm.order_id
                where pm.status = 'SUCCESS'
                  and o.status <> 'CANCELLED'
                  and pm.paid_at >= :start and pm.paid_at < :end
                group by date(pm.paid_at)
                order by date(pm.paid_at)
                """)
                .setParameter("start", range.start().atStartOfDay())
                .setParameter("end", range.endExclusive().atStartOfDay())
                .getResultList();
        return rows.stream()
                .map(row -> new DashboardSummaryResponse.SalesPoint(
                        toLocalDate(row[0]),
                        money(row[1])
                ))
                .toList();
    }

    private List<DashboardSummaryResponse.CategorySales> categorySales(DateRange range) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                select coalesce(c.name, 'Khác'), coalesce(sum(oi.line_total), 0)
                from order_items oi
                join orders o on o.id = oi.order_id
                join products p on p.id = oi.product_id
                left join categories c on c.id = p.category_id
                join payments pm on pm.order_id = o.id
                where pm.status = 'SUCCESS'
                  and pm.paid_at >= :start and pm.paid_at < :end
                  and o.status <> 'CANCELLED'
                group by c.id, c.name
                order by sum(oi.line_total) desc, c.id
                """)
                .setParameter("start", range.start().atStartOfDay())
                .setParameter("end", range.endExclusive().atStartOfDay())
                .getResultList();
        return rows.stream()
                .map(row -> new DashboardSummaryResponse.CategorySales(
                        (String) row[0],
                        money(row[1])
                ))
                .toList();
    }

    private List<DashboardSummaryResponse.LowStockItem> lowStockItems() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                select id, name, stock_quantity, unit, min_stock_level
                from ingredients
                where status = true
                  and min_stock_level is not null
                  and stock_quantity <= min_stock_level
                order by (min_stock_level - stock_quantity) desc, id
                limit 10
                """)
                .getResultList();
        return rows.stream()
                .map(row -> new DashboardSummaryResponse.LowStockItem(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        money(row[2]),
                        (String) row[3],
                        money(row[4])
                ))
                .toList();
    }

    private List<DashboardSummaryResponse.RecentOrder> recentOrders() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                select o.id, o.order_code, c.full_name, o.order_date,
                       coalesce(o.total_amount, 0), coalesce(o.discount_amount, 0),
                       o.status, pm.status
                from orders o
                left join customers c on c.id = o.customer_id
                left join payments pm on pm.order_id = o.id
                order by o.order_date desc, o.id desc
                limit 5
                """)
                .getResultList();
        return rows.stream()
                .map(row -> new DashboardSummaryResponse.RecentOrder(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        (String) row[2],
                        row[3] == null ? null : toLocalDateTime(row[3]),
                        money(row[4]),
                        money(row[5]),
                        (String) row[6],
                        (String) row[7]
                ))
                .toList();
    }

    private Object[] topProduct(DateRange range) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                select p.name, coalesce(sum(oi.quantity), 0) as sold_quantity
                from order_items oi
                join orders o on o.id = oi.order_id
                join products p on p.id = oi.product_id
                join payments pm on pm.order_id = o.id
                where pm.status = 'SUCCESS'
                  and pm.paid_at >= :start and pm.paid_at < :end
                  and o.status <> 'CANCELLED'
                group by p.id, p.name
                order by sold_quantity desc, p.id
                limit 1
                """)
                .setParameter("start", range.start().atStartOfDay())
                .setParameter("end", range.endExclusive().atStartOfDay())
                .getResultList();
        return rows.isEmpty() ? null : rows.get(0);
    }

    private BigDecimal money(Object value) {
        if (value instanceof BigDecimal amount) return amount;
        if (value instanceof Number number) return new BigDecimal(number.toString());
        throw new IllegalStateException("Dashboard query returned a non-numeric value");
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof java.sql.Timestamp timestamp) return timestamp.toLocalDateTime();
        if (value instanceof LocalDateTime dateTime) return dateTime;
        return LocalDateTime.parse(value.toString().replace(' ', 'T'));
    }

    static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate date) return date;
        if (value instanceof Date date) return date.toLocalDate();
        throw new IllegalStateException("Dashboard query returned a non-date value");
    }

    record DateRange(LocalDate start, LocalDate endExclusive, String label) {
        static DateRange forPeriod(String period, LocalDate today) {
            return switch (period == null ? "week" : period.toLowerCase()) {
                case "today" -> new DateRange(today, today.plusDays(1), "Hôm nay");
                case "month" -> {
                    YearMonth month = YearMonth.from(today);
                    yield new DateRange(month.atDay(1), month.plusMonths(1).atDay(1), "Tháng này");
                }
                case "week" -> new DateRange(today.minusDays(6), today.plusDays(1), "7 ngày qua");
                default -> throw new IllegalArgumentException("Khoảng thời gian không hợp lệ");
            };
        }
    }
}
