package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class EmailVerificationServiceTest {
    private JavaMailSender mailSender;
    private AfterCommitEmailSender afterCommitEmailSender;
    private AccountRepository accountRepository;
    private EmailVerificationService service;
    private TestTransactionManager transactionManager;
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        afterCommitEmailSender = new AfterCommitEmailSender(mailSender);
        accountRepository = mock(AccountRepository.class);
        service = new EmailVerificationService(afterCommitEmailSender, accountRepository);
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(service, "senderEmail", "");
        transactionManager = new TestTransactionManager();
        transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Test
    void sendsVerificationOnlyAfterTransactionCommit() {
        Account account = pendingAccount();
        when(accountRepository.save(account)).thenReturn(account);
        doAnswer(invocation -> {
            assertTrue(transactionManager.committed);
            return null;
        }).when(mailSender).send(any(SimpleMailMessage.class));

        transactionTemplate.executeWithoutResult(status -> service.sendVerification(account));

        verify(mailSender).send(any(SimpleMailMessage.class));
        assertNotNull(account.getEmailVerificationTokenHash());
        assertEquals(64, account.getEmailVerificationTokenHash().length());
        LocalDateTime now = LocalDateTime.now();
        assertTrue(account.getEmailVerificationTokenExpiresAt().isAfter(now.plusMinutes(29)));
        assertTrue(account.getEmailVerificationTokenExpiresAt().isBefore(now.plusMinutes(31)));
    }

    @Test
    void doesNotSendVerificationWhenTransactionRollsBack() {
        Account account = pendingAccount();
        when(accountRepository.save(account)).thenReturn(account);

        transactionTemplate.executeWithoutResult(status -> {
            service.sendVerification(account);
            status.setRollbackOnly();
        });

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void smtpFailureAfterCommitDoesNotEscapeTransactionCallback() {
        Account account = pendingAccount();
        when(accountRepository.save(account)).thenReturn(account);
        doThrow(new MailSendException("test failure"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        transactionTemplate.executeWithoutResult(status -> service.sendVerification(account));

        assertTrue(transactionManager.committed);
        assertNotNull(account.getEmailVerificationTokenHash());
        assertEquals("PENDING_VERIFICATION", account.getStatus());
        verify(accountRepository).save(account);
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void resendSchedulesOneMessageAfterCommit() {
        Account account = pendingAccount();
        account.setEmailVerificationTokenExpiresAt(null);
        when(accountRepository.findByEmailIgnoreCase("customer@example.com"))
                .thenReturn(Optional.of(account));
        when(accountRepository.save(account)).thenReturn(account);
        doAnswer(invocation -> {
            assertTrue(transactionManager.committed);
            return null;
        }).when(mailSender).send(any(SimpleMailMessage.class));

        transactionTemplate.executeWithoutResult(
                status -> service.resendVerification("customer@example.com"));

        verify(accountRepository).save(account);
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void doesNotSaveOrSendWhenNoTransactionIsActive() {
        assertThrows(IllegalStateException.class, () -> service.sendVerification(pendingAccount()));

        verifyNoInteractions(accountRepository, mailSender);
    }

    private Account pendingAccount() {
        Account account = new Account();
        account.setUsername("customer");
        account.setEmail("customer@example.com");
        account.setEmailVerified(false);
        account.setStatus("PENDING_VERIFICATION");
        return account;
    }

    private static final class TestTransactionManager extends AbstractPlatformTransactionManager {
        private boolean committed;

        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
            committed = false;
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
            committed = true;
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    }
}
