package com.nhom4.QuanLyTiemBanhNgot.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

class AfterCommitEmailSenderTests {
    private JavaMailSender mailSender;
    private AfterCommitEmailSender afterCommitEmailSender;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        afterCommitEmailSender = new AfterCommitEmailSender(mailSender, "bakery@example.com");
        TransactionSynchronizationManager.setActualTransactionActive(true);
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        TransactionSynchronizationManager.clearSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void appliesConfiguredSenderToMessagesWithoutFromAfterCommit() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("customer@example.com");
        message.setSubject("Test email");

        afterCommitEmailSender.sendAfterCommit(message);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);

        ArgumentCaptor<SimpleMailMessage> messageCaptor =
                ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, timeout(1000)).send(messageCaptor.capture());
        assertEquals("bakery@example.com", messageCaptor.getValue().getFrom());
    }
}
