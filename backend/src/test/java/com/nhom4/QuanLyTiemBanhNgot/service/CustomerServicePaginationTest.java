package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.repository.CustomerRepository;
import com.nhom4.QuanLyTiemBanhNgot.mapper.CustomerMapper;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.lang.reflect.Proxy;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerServicePaginationTest {

    @Test
    void forwardsTrimmedKeywordAndDatabasePageable() {
        CustomerRepository repository = (CustomerRepository) Proxy.newProxyInstance(
                CustomerRepository.class.getClassLoader(),
                new Class<?>[]{CustomerRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findPageByKeyword") && args.length == 2) {
                        assertEquals("wa bakery", args[0]);
                        Pageable pageable = (Pageable) args[1];
                        assertEquals(1, pageable.getPageNumber());
                        assertEquals(5, pageable.getPageSize());
                        assertEquals(
                                Sort.by(Sort.Order.desc("email"), Sort.Order.asc("id")),
                                pageable.getSort());
                        return Page.empty(pageable);
                    }
                    throw new UnsupportedOperationException(method.getName());
                });

        var result = new CustomerService(repository, null, null, null, new CustomerMapper())
                .findPage(1, 5, " wa bakery ", "email", "DESC");

        assertEquals(0, result.getTotalElements());
    }
}
