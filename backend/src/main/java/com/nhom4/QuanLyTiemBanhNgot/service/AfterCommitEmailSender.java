package com.nhom4.QuanLyTiemBanhNgot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
    private final String senderEmail;

    public AfterCommitEmailSender(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String senderEmail) {
        this.mailSender = mailSender;
        this.senderEmail = senderEmail;
    }

    public void sendAfterCommit(SimpleMailMessage message) {
        requireActiveTransaction();
        if ((message.getFrom() == null || message.getFrom().isBlank())
                && senderEmail != null && !senderEmail.isBlank()) {
            message.setFrom(senderEmail);
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                java.util.concurrent.CompletableFuture.runAsync(() -> {
                    try {
                        mailSender.send(message);
                        LOGGER.info("Email sent successfully: {}", message.getSubject());
                    } catch (MailException exception) {
                        LOGGER.warn("Email could not be sent after the database transaction committed: {}", exception.getMessage());
                    } catch (Exception ex) {
                        LOGGER.warn("Background email sending encountered an error: {}", ex.getMessage());
                    }
                });
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
