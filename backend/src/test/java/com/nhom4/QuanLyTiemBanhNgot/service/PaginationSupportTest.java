package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PaginationSupportTest {

    private static final Set<String> SORTS = Set.of("id", "name");

    @Test
    void rejectsInvalidPageSizeAndSort() {
        assertBadRequest(() -> PaginationSupport.pageRequest(-1, 20, "name", "ASC", "name", SORTS));
        assertBadRequest(() -> PaginationSupport.pageRequest(0, 0, "name", "ASC", "name", SORTS));
        assertBadRequest(() -> PaginationSupport.pageRequest(0, 101, "name", "ASC", "name", SORTS));
        assertBadRequest(() -> PaginationSupport.pageRequest(0, 20, "unknown", "ASC", "name", SORTS));
        assertBadRequest(() -> PaginationSupport.pageRequest(0, 20, "name", "sideways", "name", SORTS));
    }

    @Test
    void createsWhitelistedStableSort() {
        var pageable = PaginationSupport.pageRequest(2, 25, "name", "DESC", "name", SORTS);

        assertEquals(2, pageable.getPageNumber());
        assertEquals(25, pageable.getPageSize());
        assertEquals(Sort.by(Sort.Order.desc("name"), Sort.Order.asc("id")), pageable.getSort());
    }

    @Test
    void responseIncludesPageMetadata() {
        var source = new PageImpl<>(List.of("a", "b"), PageRequest.of(1, 2), 5);

        var response = PageResponse.from(source);

        assertEquals(List.of("a", "b"), response.content());
        assertEquals(1, response.page());
        assertEquals(2, response.size());
        assertEquals(5, response.totalElements());
        assertEquals(3, response.totalPages());
    }

    private static void assertBadRequest(Runnable action) {
        var exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(400, exception.getStatusCode().value());
    }
}
