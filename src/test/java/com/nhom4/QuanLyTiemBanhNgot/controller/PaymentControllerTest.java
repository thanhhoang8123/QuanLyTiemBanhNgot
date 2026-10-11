package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.CreatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.PaymentResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.GlobalExceptionHandler;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.math.BigDecimal;
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
class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new PaymentController(paymentService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void getPaymentsUsesExistingUrlAndReturnsFlatPaymentDto() throws Exception {
        when(paymentService.findAll()).thenReturn(List.of(
                new PaymentResponse(
                        3L, 9L, new BigDecimal("150.00"),
                        "CASH", null, null, null, null
                )
        ));

        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].orderId").value(9))
                .andExpect(jsonPath("$[0].order").doesNotExist());
    }

    @Test
    void missingPaymentStillReturns404ThroughGlobalHandler() throws Exception {
        when(paymentService.findById(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy thanh toán"));

        mockMvc.perform(get("/api/payments/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Không tìm thấy thanh toán"));
    }

    @Test
    void createUsesExistingUrlValidatesRequestAndIgnoresBackendControlledFields()
            throws Exception {
        when(paymentService.create(any(CreatePaymentRequest.class))).thenReturn(
                new PaymentResponse(7L, 9L, null, "CASH", null, null, null, null)
        );

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "orderId": 9,
                                  "paymentMethod": "CASH",
                                  "id": 300,
                                  "status": "SUCCESS",
                                  "amount": 999999,
                                  "transactionId": "client-value",
                                  "provider": "client-value",
                                  "paidAt": "2026-10-11T17:00:00"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.orderId").value(9))
                .andExpect(jsonPath("$.status").doesNotExist())
                .andExpect(jsonPath("$.amount").doesNotExist());

        verify(paymentService).create(new CreatePaymentRequest(9L, "CASH"));
    }

    @Test
    void createRejectsInvalidRequestWith400() throws Exception {
        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "orderId": 0,
                                  "paymentMethod": "WIRE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void simulationUsesDedicatedEndpointAndRequestDto() throws Exception {
        when(paymentService.simulate(7L, new SimulatePaymentRequest("SUCCESS")))
                .thenReturn(new PaymentResponse(
                        7L, 9L, new BigDecimal("150.00"),
                        "CARD", "SUCCESS", null, null,
                        java.time.LocalDateTime.parse("2026-10-11T11:00:00")
                ));

        mockMvc.perform(post("/api/payments/7/simulate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"result":"SUCCESS"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.orderId").value(9))
                .andExpect(jsonPath("$.paidAt").exists());

        verify(paymentService).simulate(7L, new SimulatePaymentRequest("SUCCESS"));
    }

    @Test
    void simulationRejectsInvalidResultWith400() throws Exception {
        mockMvc.perform(post("/api/payments/7/simulate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"result":"PENDING"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void putDoesNotBindOrApplySensitivePaymentFields() throws Exception {
        doThrow(new ConflictException("Không hỗ trợ cập nhật Payment trực tiếp"))
                .when(paymentService).update(7L);

        mockMvc.perform(put("/api/payments/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": 80,
                                  "order": {"id": 90},
                                  "amount": 1,
                                  "status": "SUCCESS",
                                  "paidAt": "2026-10-11T17:00:00",
                                  "transactionId": "forged",
                                  "provider": "forged"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Không hỗ trợ cập nhật Payment trực tiếp"));

        verify(paymentService).update(7L);
    }

    @Test
    void putMissingPaymentReturns404() throws Exception {
        doThrow(new ResourceNotFoundException("Không tìm thấy thanh toán"))
                .when(paymentService).update(999L);

        mockMvc.perform(put("/api/payments/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteSuccessConflictIsReturnedByGlobalExceptionHandler() throws Exception {
        doThrow(new ConflictException("Không thể xóa Payment đã thanh toán thành công"))
                .when(paymentService).deleteById(7L);

        mockMvc.perform(delete("/api/payments/7"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void allEndpointsKeepExistingBaseAndResourcePaths() {
        org.junit.jupiter.api.Assertions.assertEquals(
                "/api/payments",
                PaymentController.class.getAnnotation(RequestMapping.class).value()[0]
        );
        var mappings = java.util.Arrays.stream(PaymentController.class.getDeclaredMethods())
                .map(method -> {
                    if (method.isAnnotationPresent(GetMapping.class)) {
                        return method.getAnnotation(GetMapping.class).value();
                    }
                    if (method.isAnnotationPresent(PostMapping.class)) {
                        return method.getAnnotation(PostMapping.class).value();
                    }
                    if (method.isAnnotationPresent(PutMapping.class)) {
                        return method.getAnnotation(PutMapping.class).value();
                    }
                    if (method.isAnnotationPresent(DeleteMapping.class)) {
                        return method.getAnnotation(DeleteMapping.class).value();
                    }
                    return new String[0];
                })
                .flatMap(java.util.Arrays::stream)
                .toList();
        org.junit.jupiter.api.Assertions.assertEquals(4, mappings.size());
        org.junit.jupiter.api.Assertions.assertEquals(
                3,
                mappings.stream().filter("/{id}"::equals).count()
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                mappings.stream().anyMatch("/{id}/simulate"::equals)
        );
    }
}
