package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.repository.CategoryRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductDeleteTests {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private PromotionProductRepository promotionProductRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void deleteRejectsProductsReferencedByAnOrder() {
        Product product = new Product();
        product.setId(7L);
        when(productRepository.findByIdForUpdate(7L))
                .thenReturn(Optional.of(product));
        when(orderItemRepository.existsByProduct_Id(7L)).thenReturn(true);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> productService.delete(7L));

        assertEquals(
                "Không thể xóa sản phẩm vì sản phẩm đã có trong đơn hàng.",
                error.getReason());
        verify(productRepository, never()).delete(product);
        verify(promotionProductRepository, never()).findByProduct_Id(7L);
    }

    @Test
    void deleteRemovesPromotionLinksAndUnreferencedProduct() {
        Product product = new Product();
        product.setId(8L);
        when(productRepository.findByIdForUpdate(8L))
                .thenReturn(Optional.of(product));
        when(orderItemRepository.existsByProduct_Id(8L)).thenReturn(false);
        when(promotionProductRepository.findByProduct_Id(8L))
                .thenReturn(List.of());

        productService.delete(8L);

        verify(promotionProductRepository).deleteAll(List.of());
        verify(productRepository).delete(product);
    }

    @Test
    void deactivateOnlyChangesTheBusinessStatus() {
        Product product = new Product();
        product.setId(9L);
        product.setStatus(true);
        when(productRepository.findByIdForUpdate(9L))
                .thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        Product result = productService.deactivate(9L);

        assertEquals(false, result.getStatus());
        verify(productRepository, never()).delete(product);
    }
}
