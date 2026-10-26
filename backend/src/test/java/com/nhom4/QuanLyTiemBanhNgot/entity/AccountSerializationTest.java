package com.nhom4.QuanLyTiemBanhNgot.entity;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;

class AccountSerializationTest {

    @Test
    void ignoresPasswordAndVerificationSecretsDuringJsonSerialization() throws Exception {
        Account account = new Account();
        account.setPasswordHash("hashed-password");
        account.setEmailVerificationTokenHash("verification-token-hash");
        account.setEmailVerificationTokenExpiresAt(java.time.LocalDateTime.of(2026, 10, 26, 10, 0));

        String json = new ObjectMapper().writeValueAsString(account);

        assertFalse(json.contains("passwordHash"));
        assertFalse(json.contains("hashed-password"));
        assertFalse(json.contains("emailVerificationTokenHash"));
        assertFalse(json.contains("verification-token-hash"));
        assertFalse(json.contains("emailVerificationTokenExpiresAt"));
    }
}
