package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductResponse;
import com.nhom4.QuanLyTiemBanhNgot.exception.GlobalExceptionHandler;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.service.PromotionProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PromotionProductControllerTest {

    @Mock
    private PromotionProductService promotionProductService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new PromotionProductController(promotionProductService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void getAllReturnsFlatLinkDtos() throws Exception {
        when(promotionProductService.findAll())
                .thenReturn(List.of(new PromotionProductResponse(3L, 8L)));

        mockMvc.perform(get("/api/promotion-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].promotionId").value(3))
                .andExpect(jsonPath("$[0].productId").value(8))
                .andExpect(jsonPath("$[0].promotion").doesNotExist())
                .andExpect(jsonPath("$[0].product").doesNotExist());
    }

    @Test
    void getByIdsReturns404WhenLinkDoesNotExist() throws Exception {
        when(promotionProductService.findByIds(3L, 8L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy liên kết"));

        mockMvc.perform(get("/api/promotion-products/3/8"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void postAcceptsOnlyIdsAndReturnsCreated() throws Exception {
        when(promotionProductService.create(any(PromotionProductRequest.class)))
                .thenReturn(new PromotionProductResponse(3L, 8L));

        mockMvc.perform(post("/api/promotion-products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "promotionId":3,
                                  "productId":8,
                                  "promotion":{"id":90},
                                  "product":{"id":91}
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.promotionId").value(3))
                .andExpect(jsonPath("$.productId").value(8))
                .andExpect(jsonPath("$.promotion").doesNotExist());

        verify(promotionProductService).create(new PromotionProductRequest(3L, 8L));
    }

    @Test
    void postRejectsMissingOrNonPositiveIds() throws Exception {
        mockMvc.perform(post("/api/promotion-products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"promotionId":0,"productId":null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void deleteReturnsNoContentAndKeepsBothIdsInPath() throws Exception {
        mockMvc.perform(delete("/api/promotion-products/3/8"))
                .andExpect(status().isNoContent());

        verify(promotionProductService).deleteByIds(3L, 8L);
    }

    @Test
    void deleteMissingLinkReturns404() throws Exception {
        doThrow(new ResourceNotFoundException("Không tìm thấy liên kết"))
                .when(promotionProductService).deleteByIds(3L, 8L);

        mockMvc.perform(delete("/api/promotion-products/3/8"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
