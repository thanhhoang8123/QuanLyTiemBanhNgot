package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.CreatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.PromotionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.UpdatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PromotionMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionServiceTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PromotionProductRepository promotionProductRepository;

    private PromotionService promotionService;

    @BeforeEach
    void setUp() {
        promotionService = new PromotionService(
                promotionRepository,
                promotionProductRepository,
                new PromotionMapper()
        );
    }

    @Test
    void createsValidPromotionAndReturnsResponse() {
        when(promotionRepository.existsByPromotionCodeIgnoreCase("SPRING10"))
                .thenReturn(false);
        when(promotionRepository.saveAndFlush(any(Promotion.class)))
                .thenAnswer(invocation -> {
                    Promotion promotion = invocation.getArgument(0);
                    promotion.setId(7L);
                    return promotion;
                });

        PromotionResponse response = promotionService.create(validCreateRequest());

        assertEquals(7L, response.id());
        assertEquals("SPRING10", response.promotionCode());
        assertEquals(new BigDecimal("10.00"), response.discountPercent());
        verify(promotionRepository).saveAndFlush(any(Promotion.class));
    }

    @Test
    void duplicatePromotionCodeReturnsConflict() {
        when(promotionRepository.existsByPromotionCodeIgnoreCase("SPRING10"))
                .thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> promotionService.create(validCreateRequest())
        );
        verify(promotionRepository, never()).saveAndFlush(any(Promotion.class));
    }

    @Test
    void rejectsZeroNegativeOrOverOneHundredPercent() {
        assertThrows(BadRequestException.class,
                () -> promotionService.create(createRequest(new BigDecimal("0.00"),
                        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.now(),
                        LocalDate.now().plusDays(1))));
        assertThrows(BadRequestException.class,
                () -> promotionService.create(createRequest(new BigDecimal("-1.00"),
                        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.now(),
                        LocalDate.now().plusDays(1))));
        assertThrows(BadRequestException.class,
                () -> promotionService.create(createRequest(new BigDecimal("100.01"),
                        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.now(),
                        LocalDate.now().plusDays(1))));
        verify(promotionRepository, never()).saveAndFlush(any(Promotion.class));
    }

    @Test
    void rejectsNegativeMoneyValues() {
        assertThrows(BadRequestException.class,
                () -> promotionService.create(createRequest(new BigDecimal("10.00"),
                        new BigDecimal("-0.01"), BigDecimal.ZERO, LocalDate.now(),
                        LocalDate.now().plusDays(1))));
        assertThrows(BadRequestException.class,
                () -> promotionService.create(createRequest(new BigDecimal("10.00"),
                        BigDecimal.ZERO, new BigDecimal("-0.01"), LocalDate.now(),
                        LocalDate.now().plusDays(1))));
    }

    @Test
    void rejectsStartDateAfterEndDate() {
        assertThrows(BadRequestException.class,
                () -> promotionService.create(createRequest(new BigDecimal("10.00"),
                        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.now().plusDays(2),
                        LocalDate.now().plusDays(1))));
    }

    @Test
    void getPutAndDeleteReturnNotFoundWhenIdIsMissing() {
        when(promotionRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> promotionService.findById(404L));
        assertThrows(ResourceNotFoundException.class,
                () -> promotionService.update(404L, validUpdateRequest()));
        assertThrows(ResourceNotFoundException.class,
                () -> promotionService.deleteById(404L));
    }

    @Test
    void doesNotDeletePromotionWithProductLinks() {
        Promotion promotion = promotion(8L);
        when(promotionRepository.findById(8L)).thenReturn(Optional.of(promotion));
        when(promotionProductRepository.existsByIdPromotionId(8L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> promotionService.deleteById(8L));
        verify(promotionRepository, never()).delete(any(Promotion.class));
    }

    @Test
    void updatesFieldsWithoutChangingDatabaseId() {
        Promotion promotion = promotion(9L);
        when(promotionRepository.findById(9L)).thenReturn(Optional.of(promotion));
        when(promotionRepository.existsByPromotionCodeIgnoreCaseAndIdNot("UPDATED", 9L))
                .thenReturn(false);
        when(promotionRepository.saveAndFlush(promotion)).thenReturn(promotion);

        PromotionResponse response = promotionService.update(9L, validUpdateRequest());

        assertEquals(9L, response.id());
        assertEquals("UPDATED", response.promotionCode());
        assertEquals("Updated promotion", response.name());
        verify(promotionRepository).saveAndFlush(promotion);
    }

    @Test
    void updateRejectsCodeUsedByAnotherPromotion() {
        Promotion promotion = promotion(9L);
        when(promotionRepository.findById(9L)).thenReturn(Optional.of(promotion));
        when(promotionRepository.existsByPromotionCodeIgnoreCaseAndIdNot("UPDATED", 9L))
                .thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> promotionService.update(9L, validUpdateRequest())
        );
        verify(promotionRepository, never()).saveAndFlush(any(Promotion.class));
    }

    @Test
    void findAllAndSearchMapEntitiesToResponses() {
        Promotion promotion = promotion(9L);
        when(promotionRepository.findAll()).thenReturn(List.of(promotion));
        when(promotionRepository
                .findByPromotionCodeContainingIgnoreCaseOrNameContainingIgnoreCase("SPR", "SPR"))
                .thenReturn(List.of(promotion));

        assertEquals(9L, promotionService.findAll().getFirst().id());
        assertEquals(9L, promotionService.search(" SPR ").getFirst().id());
    }

    private CreatePromotionRequest validCreateRequest() {
        return createRequest(
                new BigDecimal("10.00"),
                new BigDecimal("50000.00"),
                new BigDecimal("200000.00"),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31)
        );
    }

    private CreatePromotionRequest createRequest(
            BigDecimal discountPercent,
            BigDecimal maxDiscount,
            BigDecimal minOrderValue,
            LocalDate startDate,
            LocalDate endDate) {
        return new CreatePromotionRequest(
                " SPRING10 ",
                " Spring promotion ",
                discountPercent,
                maxDiscount,
                minOrderValue,
                startDate,
                endDate,
                true
        );
    }

    private UpdatePromotionRequest validUpdateRequest() {
        return new UpdatePromotionRequest(
                "UPDATED",
                "Updated promotion",
                new BigDecimal("15.00"),
                new BigDecimal("30000.00"),
                new BigDecimal("100000.00"),
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 11, 30),
                false
        );
    }

    private Promotion promotion(Long id) {
        Promotion promotion = new Promotion();
        promotion.setId(id);
        promotion.setPromotionCode("ORIGINAL");
        promotion.setName("Original promotion");
        promotion.setDiscountPercent(new BigDecimal("10.00"));
        promotion.setMaxDiscount(new BigDecimal("50000.00"));
        promotion.setMinOrderValue(new BigDecimal("200000.00"));
        promotion.setStartDate(LocalDate.of(2026, 1, 1));
        promotion.setEndDate(LocalDate.of(2026, 12, 31));
        promotion.setStatus(true);
        return promotion;
    }
}
