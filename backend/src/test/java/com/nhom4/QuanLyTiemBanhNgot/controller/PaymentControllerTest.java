package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.SimulatePaymentRequest;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PaymentControllerTest {

    @Test
    void simulationIsForbiddenWhenDisabled() {
        PaymentController controller = new PaymentController(null, false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.simulatePayment(1L, new SimulatePaymentRequest("SUCCESS"))
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void developmentProfileRequiresExplicitSimulationOptIn() throws IOException {
        Properties properties = new Properties();
        try (var stream = new ClassPathResource("application-dev.properties").getInputStream()) {
            properties.load(stream);
        }

        assertEquals(
                "${PAYMENT_SIMULATION_ENABLED:false}",
                properties.getProperty("app.payment-simulation.enabled"));
    }
}
