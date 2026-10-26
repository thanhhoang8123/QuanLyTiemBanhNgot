package com.nhom4.QuanLyTiemBanhNgot.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MongoUriConfigurationTest {

    @Test
    void missingOrBlankUriReportsSafeConfigurationGuidance() {
        IllegalStateException missing = assertThrows(
                IllegalStateException.class,
                () -> MongoUriConfiguration.requireValidMongoUri(null));
        IllegalStateException blank = assertThrows(
                IllegalStateException.class,
                () -> MongoUriConfiguration.requireValidMongoUri("  "));

        assertEquals(missing.getMessage(), blank.getMessage());
        org.junit.jupiter.api.Assertions.assertTrue(
                missing.getMessage().contains("MONGODB_URI"));
    }

    @Test
    void malformedUriReportsConfigurationErrorWithoutEchoingValue() {
        String malformedUri = "not-a-mongodb-uri-secret";

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> MongoUriConfiguration.requireValidMongoUri(malformedUri));

        org.junit.jupiter.api.Assertions.assertTrue(exception.getMessage().contains("MONGODB_URI"));
        org.junit.jupiter.api.Assertions.assertFalse(exception.getMessage().contains(malformedUri));
        org.junit.jupiter.api.Assertions.assertEquals(null, exception.getCause());
    }
}
