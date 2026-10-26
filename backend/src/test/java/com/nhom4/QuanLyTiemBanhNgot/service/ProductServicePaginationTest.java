package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Proxy;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class ProductServicePaginationTest {

    @Test
    void forwardsTrimmedSearchAndDatabasePageable() {
        Product product = new Product();
        product.setId(7L);
        ProductRepository repository = (ProductRepository) Proxy.newProxyInstance(
                ProductRepository.class.getClassLoader(),
                new Class<?>[]{ProductRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findPageByFilters") && args.length == 4) {
                        assertEquals("croissant", args[0]);
                        assertEquals(3L, args[1]);
                        assertEquals(true, args[2]);
                        Pageable pageable = (Pageable) args[3];
                        assertEquals(1, pageable.getPageNumber());
                        assertEquals(4, pageable.getPageSize());
                        return new PageImpl<>(List.of(product), pageable, 9);
                    }
                    throw new UnsupportedOperationException(method.getName());
                });

        var result = new ProductService(repository, null)
                .getPage(1, 4, " croissant ", 3L, true, "price", "DESC");

        assertSame(product, result.getContent().get(0));
        assertEquals(9, result.getTotalElements());
    }
}
