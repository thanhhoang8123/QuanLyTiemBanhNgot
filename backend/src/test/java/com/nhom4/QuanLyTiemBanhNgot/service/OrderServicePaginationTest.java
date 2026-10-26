package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Proxy;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderServicePaginationTest {

    @Test
    void forwardsSearchStatusDateRangeAndDatabasePageable() {
        LocalDate dateFrom = LocalDate.of(2026, 10, 1);
        LocalDate dateTo = LocalDate.of(2026, 10, 31);
        OrderRepository repository = (OrderRepository) Proxy.newProxyInstance(
                OrderRepository.class.getClassLoader(),
                new Class<?>[]{OrderRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findPageByFilters") && args.length == 5) {
                        assertEquals("croissant", args[0]);
                        assertEquals("PENDING", args[1]);
                        assertEquals(dateFrom.atStartOfDay(), args[2]);
                        assertEquals(LocalDate.of(2026, 11, 1).atStartOfDay(), args[3]);
                        Pageable pageable = (Pageable) args[4];
                        assertEquals(2, pageable.getPageNumber());
                        assertEquals(10, pageable.getPageSize());
                        return Page.empty(pageable);
                    }
                    throw new UnsupportedOperationException(method.getName());
                });

        var result = new OrderService(
                repository, null, null, null, null, null, null, null, null, null, null, null)
                .findPage(2, 10, " croissant ", "PENDING", dateFrom, dateTo, "orderDate", "DESC");

        assertEquals(0, result.getTotalElements());
    }

    @Test
    void rejectsInvertedDateRangeBeforeQueryingRepository() {
        OrderRepository repository = (OrderRepository) Proxy.newProxyInstance(
                OrderRepository.class.getClassLoader(),
                new Class<?>[]{OrderRepository.class},
                (proxy, method, args) -> {
                    throw new AssertionError("Repository should not be queried for an invalid range");
                });

        var service = new OrderService(
                repository, null, null, null, null, null, null, null, null, null, null, null);
        var exception = assertThrows(
                ResponseStatusException.class,
                () -> service.findPage(
                        0,
                        20,
                        null,
                        null,
                        LocalDate.of(2026, 11, 1),
                        LocalDate.of(2026, 10, 1),
                        "orderDate",
                        "DESC"));

        assertEquals(400, exception.getStatusCode().value());
    }
}
