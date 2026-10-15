package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CustomOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.exception.GlobalExceptionHandler;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomOrderService;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CustomOrderControllerTest {

    @Mock
    private CustomOrderService customOrderService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new CustomOrderController(customOrderService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void createUsesDtoAndReturnsCreatedWithoutAcceptingSystemFields() throws Exception {
        when(customOrderService.create(any())).thenReturn(response("PENDING"));

        mockMvc.perform(post("/api/custom-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerId": 1,
                                  "employeeId": 2,
                                  "cakeName": "Birthday cake",
                                  "requestDescription": "Blue icing",
                                  "deliveryDate": "2026-10-20T10:00:00",
                                  "estimatedPrice": 500.00,
                                  "deposit": 100.00,
                                  "id": 999,
                                  "orderDate": "2000-01-01T00:00:00",
                                  "status": "COMPLETED"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.customer.id").doesNotExist());
    }

    @Test
    void createRejectsInvalidFieldsWith400() throws Exception {
        mockMvc.perform(post("/api/custom-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerId": -1,
                                  "employeeId": null,
                                  "cakeName": " ",
                                  "deliveryDate": null,
                                  "estimatedPrice": 0,
                                  "deposit": -1
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void listReturnsDtoResponses() throws Exception {
        when(customOrderService.findAll()).thenReturn(List.of(response("PENDING")));

        mockMvc.perform(get("/api/custom-orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerId").value(1))
                .andExpect(jsonPath("$[0].employeeId").value(2))
                .andExpect(jsonPath("$[0].customer").doesNotExist());
    }

    @Test
    void missingOrderUsesSharedNotFoundHandler() throws Exception {
        when(customOrderService.findById(404L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy đơn đặt bánh"));

        mockMvc.perform(get("/api/custom-orders/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void statusEndpointUsesDedicatedRequest() throws Exception {
        when(customOrderService.updateStatus(any(), any())).thenReturn(response("CONFIRMED"));

        mockMvc.perform(patch("/api/custom-orders/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CONFIRMED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(customOrderService).updateStatus(
                org.mockito.ArgumentMatchers.eq(10L),
                any()
        );
    }

    @Test
    void statusEndpointRejectsStatusNotInErd() throws Exception {
        mockMvc.perform(patch("/api/custom-orders/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PAID"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateAndDeleteKeepResourceUrls() throws Exception {
        when(customOrderService.update(any(), any())).thenReturn(response("PENDING"));

        mockMvc.perform(put("/api/custom-orders/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerId": 1,
                                  "employeeId": 2,
                                  "cakeName": "Updated cake",
                                  "deliveryDate": "2026-10-21T10:00:00",
                                  "estimatedPrice": 600.00,
                                  "deposit": 100.00
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/custom-orders/10"))
                .andExpect(status().isNoContent());
        verify(customOrderService).deleteById(10L);
    }

    private CustomOrderResponse response(String orderStatus) {
        return new CustomOrderResponse(
                10L,
                1L,
                2L,
                "Birthday cake",
                "Blue icing",
                LocalDateTime.parse("2026-10-11T12:00:00"),
                LocalDateTime.parse("2026-10-20T10:00:00"),
                new BigDecimal("500.00"),
                new BigDecimal("100.00"),
                orderStatus
        );
    }
}
