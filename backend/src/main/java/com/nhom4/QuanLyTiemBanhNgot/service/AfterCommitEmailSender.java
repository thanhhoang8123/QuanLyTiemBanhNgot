package com.nhom4.QuanLyTiemBanhNgot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class AfterCommitEmailSender {
    private static final Logger LOGGER = LoggerFactory.getLogger(AfterCommitEmailSender.class);

    private final JavaMailSender mailSender;

    public AfterCommitEmailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendAfterCommit(SimpleMailMessage message) {
        requireActiveTransaction();

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    mailSender.send(message);
                } catch (MailException exception) {
                    LOGGER.warn("Email could not be sent after the database transaction committed.");
                }
            }
        });
    }

    public void requireActiveTransaction() {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Emails must be scheduled inside a database transaction");
        }
    }
}
