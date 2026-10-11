package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProductId;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PromotionProductMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionProductServiceTest {

    @Mock
    private PromotionProductRepository promotionProductRepository;

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private ProductRepository productRepository;

    private PromotionProductService promotionProductService;

    @BeforeEach
    void setUp() {
        promotionProductService = new PromotionProductService(
                promotionProductRepository,
                promotionRepository,
                productRepository,
                new PromotionProductMapper()
        );
    }

    @Test
    void createsLinkWithCompositeIdAndReturnsOnlyIds() {
        Promotion promotion = new Promotion();
        promotion.setId(4L);
        Product product = new Product();
        product.setId(7L);
        PromotionProductId expectedId = new PromotionProductId(4L, 7L);

        when(promotionRepository.findById(4L)).thenReturn(Optional.of(promotion));
        when(productRepository.findById(7L)).thenReturn(Optional.of(product));
        when(promotionProductRepository.existsById(expectedId)).thenReturn(false);
        when(promotionProductRepository.saveAndFlush(any(PromotionProduct.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PromotionProductResponse response = promotionProductService.create(
                new PromotionProductRequest(4L, 7L)
        );

        ArgumentCaptor<PromotionProduct> captor =
                ArgumentCaptor.forClass(PromotionProduct.class);
        verify(promotionProductRepository).saveAndFlush(captor.capture());
        PromotionProduct saved = captor.getValue();
        assertEquals(expectedId, saved.getId());
        assertEquals(promotion, saved.getPromotion());
        assertEquals(product, saved.getProduct());
        assertEquals(4L, response.promotionId());
        assertEquals(7L, response.productId());
    }

    @Test
    void createReturnsNotFoundWhenPromotionDoesNotExist() {
        when(promotionRepository.findById(4L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> promotionProductService.create(
                        new PromotionProductRequest(4L, 7L)
                )
        );
        verify(productRepository, never()).findById(7L);
        verify(promotionProductRepository, never()).saveAndFlush(any());
    }

    @Test
    void createReturnsNotFoundWhenProductDoesNotExist() {
        Promotion promotion = new Promotion();
        promotion.setId(4L);
        when(promotionRepository.findById(4L)).thenReturn(Optional.of(promotion));
        when(productRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> promotionProductService.create(
                        new PromotionProductRequest(4L, 7L)
                )
        );
        verify(promotionProductRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRejectsDuplicateCompositeId() {
        when(promotionRepository.findById(4L)).thenReturn(Optional.of(new Promotion()));
        when(productRepository.findById(7L)).thenReturn(Optional.of(new Product()));
        when(promotionProductRepository.existsById(new PromotionProductId(4L, 7L)))
                .thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> promotionProductService.create(
                        new PromotionProductRequest(4L, 7L)
                )
        );
        verify(promotionProductRepository, never()).saveAndFlush(any());
    }

    @Test
    void findsLinkAndReturns404WhenMissing() {
        Promotion promotion = new Promotion();
        promotion.setId(4L);
        Product product = new Product();
        product.setId(7L);
        PromotionProduct link = link(promotion, product);
        when(promotionProductRepository.findById(new PromotionProductId(4L, 7L)))
                .thenReturn(Optional.of(link));

        assertEquals(4L, promotionProductService.findByIds(4L, 7L).promotionId());
        assertThrows(
                ResourceNotFoundException.class,
                () -> promotionProductService.findByIds(4L, 8L)
        );
    }

    @Test
    void listMapsAllEntitiesToResponses() {
        Promotion promotion = new Promotion();
        promotion.setId(4L);
        Product product = new Product();
        product.setId(7L);
        when(promotionProductRepository.findAll()).thenReturn(List.of(link(promotion, product)));

        List<PromotionProductResponse> responses = promotionProductService.findAll();

        assertEquals(1, responses.size());
        assertEquals(4L, responses.getFirst().promotionId());
        assertEquals(7L, responses.getFirst().productId());
    }

    @Test
    void deleteRemovesOnlyLinkAndDoesNotDeleteParentEntities() {
        Promotion promotion = new Promotion();
        promotion.setId(4L);
        Product product = new Product();
        product.setId(7L);
        PromotionProduct link = link(promotion, product);
        when(promotionProductRepository.findById(new PromotionProductId(4L, 7L)))
                .thenReturn(Optional.of(link));

        promotionProductService.deleteByIds(4L, 7L);

        verify(promotionProductRepository).delete(link);
        verify(promotionRepository, never()).delete(any(Promotion.class));
        verify(productRepository, never()).delete(any(Product.class));
    }

    @Test
    void deleteReturnsNotFoundWhenLinkDoesNotExist() {
        when(promotionProductRepository.findById(new PromotionProductId(4L, 7L)))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> promotionProductService.deleteByIds(4L, 7L)
        );
        verify(promotionProductRepository, never()).delete(any(PromotionProduct.class));
    }

    @Test
    void compositeIdEqualityUsesBothFields() {
        PromotionProductId sameId = new PromotionProductId(4L, 7L);
        PromotionProductId equalId = new PromotionProductId(4L, 7L);
        PromotionProductId differentId = new PromotionProductId(4L, 8L);

        assertEquals(sameId, equalId);
        assertEquals(sameId.hashCode(), equalId.hashCode());
        assertNotEquals(sameId, differentId);
    }

    private PromotionProduct link(Promotion promotion, Product product) {
        PromotionProduct link = new PromotionProduct();
        link.setId(new PromotionProductId(promotion.getId(), product.getId()));
        link.setPromotion(promotion);
        link.setProduct(product);
        return link;
    }
}
