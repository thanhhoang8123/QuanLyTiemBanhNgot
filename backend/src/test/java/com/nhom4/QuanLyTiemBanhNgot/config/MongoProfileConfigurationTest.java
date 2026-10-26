package com.nhom4.QuanLyTiemBanhNgot.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class MongoProfileConfigurationTest {

    @Test
    void sharedDevAndProductionMongoConfigurationUsesEnvironmentUri() throws IOException {
        Properties base = load("application.properties");
        Properties dev = load("application-dev.properties");
        Properties production = load("application-prod.properties");

        assertEquals("${MONGODB_URI}", base.getProperty("spring.mongodb.uri"));
        assertFalse(dev.containsKey("spring.mongodb.uri"));
        assertEquals("${MONGODB_URI}", production.getProperty("spring.mongodb.uri"));
        assertEquals("false", base.getProperty("app.payment-simulation.enabled"));
        assertEquals("${PAYMENT_SIMULATION_ENABLED:false}",
                dev.getProperty("app.payment-simulation.enabled"));
        assertEquals("false", production.getProperty("app.payment-simulation.enabled"));
    }

    private static Properties load(String resource) throws IOException {
        Properties properties = new Properties();
        try (var stream = new ClassPathResource(resource).getInputStream()) {
            properties.load(stream);
        }
        return properties;
    }
}
