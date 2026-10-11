package com.nhom4.QuanLyTiemBanhNgot.dto.payment;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CreatePaymentRequestValidationTest {

    private static Validator validator;
    private static jakarta.validation.ValidatorFactory validatorFactory;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @Test
    void acceptsValidOrderIdAndPaymentMethod() {
        assertTrue(validator.validate(new CreatePaymentRequest(1L, "EWALLET")).isEmpty());
    }

    @Test
    void rejectsMissingOrNonPositiveOrderId() {
        assertFalse(validator.validate(new CreatePaymentRequest(null, "CASH")).isEmpty());
        assertFalse(validator.validate(new CreatePaymentRequest(0L, "CASH")).isEmpty());
        assertFalse(validator.validate(new CreatePaymentRequest(-1L, "CASH")).isEmpty());
    }

    @Test
    void rejectsBlankOrUnsupportedPaymentMethod() {
        assertFalse(validator.validate(new CreatePaymentRequest(1L, null)).isEmpty());
        assertFalse(validator.validate(new CreatePaymentRequest(1L, " ")).isEmpty());
        assertFalse(validator.validate(new CreatePaymentRequest(1L, "WIRE")).isEmpty());
    }

    @Test
    void simulationRequestOnlyAcceptsSuccessOrFailedResult() {
        assertTrue(validator.validate(new SimulatePaymentRequest("SUCCESS")).isEmpty());
        assertTrue(validator.validate(new SimulatePaymentRequest("FAILED")).isEmpty());
        assertFalse(validator.validate(new SimulatePaymentRequest(null)).isEmpty());
        assertFalse(validator.validate(new SimulatePaymentRequest("PENDING")).isEmpty());
    }
}
