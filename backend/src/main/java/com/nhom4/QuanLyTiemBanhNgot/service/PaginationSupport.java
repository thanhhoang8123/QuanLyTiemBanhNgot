package com.nhom4.QuanLyTiemBanhNgot.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

public final class PaginationSupport {

    private PaginationSupport() {
    }

    public static Pageable pageRequest(
            int page,
            int size,
            String sortProperty,
            String direction,
            String defaultSort,
            Set<String> allowedSorts) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page must be greater than or equal to 0");
        }
        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size must be between 1 and 100");
        }

        String property = sortProperty == null || sortProperty.isBlank()
                ? defaultSort
                : sortProperty.trim();
        if (!allowedSorts.contains(property)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported sort property: " + property);
        }

        Sort.Direction sortDirection;
        try {
            sortDirection = direction == null || direction.isBlank()
                    ? Sort.Direction.ASC
                    : Sort.Direction.fromString(direction.trim());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "direction must be ASC or DESC");
        }

        Sort sort = Sort.by(sortDirection, property);
        if (!"id".equals(property)) {
            sort = sort.and(Sort.by(Sort.Direction.ASC, "id"));
        }
        return PageRequest.of(page, size, sort);
    }
}
