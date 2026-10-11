package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.CreatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.PromotionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.UpdatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.GlobalExceptionHandler;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.service.PromotionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PromotionControllerTest {

    @Mock
    private PromotionService promotionService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new PromotionController(promotionService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void createUsesDtoAndReturnsCreated() throws Exception {
        when(promotionService.create(any(CreatePromotionRequest.class)))
                .thenReturn(response(4L));

        mockMvc.perform(post("/api/promotions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "promotionCode":"KMTEST",
                                  "name":"Test promotion",
                                  "discountPercent":10.00,
                                  "maxDiscount":50000.00,
                                  "minOrderValue":200000.00,
                                  "startDate":"2026-10-01",
                                  "endDate":"2026-10-31",
                                  "status":true,
                                  "id":999
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.promotionCode").value("KMTEST"));

        verify(promotionService).create(any(CreatePromotionRequest.class));
    }

    @Test
    void createRejectsMissingOrInvalidFields() throws Exception {
        mockMvc.perform(post("/api/promotions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "promotionCode":"",
                                  "name":"",
                                  "discountPercent":101,
                                  "startDate":"2026-11-01",
                                  "endDate":"2026-10-01"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getAndSearchReturnPromotionDtos() throws Exception {
        when(promotionService.findAll()).thenReturn(List.of(response(4L)));
        when(promotionService.search("KM")).thenReturn(List.of(response(4L)));

        mockMvc.perform(get("/api/promotions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(4))
                .andExpect(jsonPath("$[0].entityRelations").doesNotExist());

        mockMvc.perform(get("/api/promotions/search").queryParam("keyword", "KM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].promotionCode").value("KMTEST"));
    }

    @Test
    void missingPromotionReturns404ForGetUpdateAndDelete() throws Exception {
        when(promotionService.findById(404L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy khuyến mãi"));
        when(promotionService.update(404L, validUpdateRequest()))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy khuyến mãi"));
        doThrow(new ResourceNotFoundException("Không tìm thấy khuyến mãi"))
                .when(promotionService).deleteById(404L);

        mockMvc.perform(get("/api/promotions/404"))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/promotions/404")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validUpdateJson()))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/promotions/404"))
                .andExpect(status().isNotFound());
    }

    @Test
    void duplicatePromotionCodeReturns409() throws Exception {
        when(promotionService.create(any(CreatePromotionRequest.class)))
                .thenThrow(new ConflictException("Mã khuyến mãi đã tồn tại"));

        mockMvc.perform(post("/api/promotions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "promotionCode":"KMTEST",
                                  "name":"Test promotion",
                                  "discountPercent":10.00,
                                  "maxDiscount":null,
                                  "minOrderValue":null,
                                  "startDate":"2026-10-01",
                                  "endDate":"2026-10-31",
                                  "status":true
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void updateKeepsExistingIdFromPathInsteadOfRequestBody() throws Exception {
        when(promotionService.update(
                org.mockito.ArgumentMatchers.eq(4L),
                any(UpdatePromotionRequest.class)
        )).thenReturn(response(4L));

        mockMvc.perform(put("/api/promotions/4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validUpdateJson().replace(
                                "\"promotionCode\":\"UPDATED\"",
                                "\"promotionCode\":\"UPDATED\",\"id\":999"
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(4));

        verify(promotionService).update(
                org.mockito.ArgumentMatchers.eq(4L),
                any(UpdatePromotionRequest.class)
        );
    }

    private PromotionResponse response(Long id) {
        return new PromotionResponse(
                id,
                "KMTEST",
                "Test promotion",
                new BigDecimal("10.00"),
                new BigDecimal("50000.00"),
                new BigDecimal("200000.00"),
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31),
                true
        );
    }

    private UpdatePromotionRequest validUpdateRequest() {
        return new UpdatePromotionRequest(
                "UPDATED", "Updated promotion", new BigDecimal("20.00"),
                null, null, LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31), true
        );
    }

    private String validUpdateJson() {
        return """
                {
                  "promotionCode":"UPDATED",
                  "name":"Updated promotion",
                  "discountPercent":20.00,
                  "maxDiscount":null,
                  "minOrderValue":null,
                  "startDate":"2026-10-01",
                  "endDate":"2026-10-31",
                  "status":true
                }
                """;
    }
}
