package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class VnPaySignatureServiceTest {

    private final VnPaySignatureService signatureService;

    VnPaySignatureServiceTest() {
        VnPayProperties properties = new VnPayProperties();
        properties.setHashSecret("unit-test-only-secret");
        signatureService = new VnPaySignatureService(properties);
    }

    @Test
    void rejectsMalformedCallbackSignature() {
        Map<String, List<String>> parameters = Map.of(
                "vnp_TxnRef", List.of("test-transaction"),
                "vnp_ResponseCode", List.of("00"),
                "vnp_SecureHash", List.of("not-a-signature")
        );

        assertFalse(signatureService.hasValidCallbackSignature(parameters));
    }

    @Test
    void rejectsDuplicateCallbackParameterValues() {
        Map<String, List<String>> parameters = Map.of(
                "vnp_TxnRef", List.of("first", "second"),
                "vnp_SecureHash", List.of("0".repeat(128))
        );

        assertFalse(signatureService.hasValidCallbackSignature(parameters));
    }

    @Test
    void vnpayAmountMustBeWholePositiveVnd() {
        assertEquals(12_345_600L, VnPaySignatureService.toVnPayAmount(new BigDecimal("123456")));
        assertThrows(
                IllegalArgumentException.class,
                () -> VnPaySignatureService.toVnPayAmount(new BigDecimal("12.5"))
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> VnPaySignatureService.toVnPayAmount(BigDecimal.ZERO)
        );
    }
}
