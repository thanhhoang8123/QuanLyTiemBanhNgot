package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class EmailVerificationService {
    private final AccountRepository accountRepository;
    private final AfterCommitEmailSender afterCommitEmailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public EmailVerificationService(
            AfterCommitEmailSender afterCommitEmailSender,
            AccountRepository accountRepository) {
        this.afterCommitEmailSender = afterCommitEmailSender;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public void sendVerification(Account account) {
        issueVerification(account);
    }

    @Transactional
    public void resendVerification(String email) {
        if (email == null || email.isBlank()) return;

        accountRepository.findByEmailIgnoreCase(email.trim())
                .filter(account -> !Boolean.TRUE.equals(account.getEmailVerified()))
                .filter(account -> "PENDING_VERIFICATION".equalsIgnoreCase(account.getStatus()))
                .filter(this::resendCooldownElapsed)
                .ifPresent(this::issueVerification);
    }

    private boolean resendCooldownElapsed(Account account) {
        LocalDateTime expiresAt = account.getEmailVerificationTokenExpiresAt();
        return expiresAt == null || !expiresAt.isAfter(LocalDateTime.now().plusMinutes(25));
    }

    private void issueVerification(Account account) {
        afterCommitEmailSender.requireActiveTransaction();

        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        account.setEmailVerificationTokenHash(sha256(rawToken));
        account.setEmailVerificationTokenExpiresAt(LocalDateTime.now().plusMinutes(30));
        accountRepository.save(account);

        String link = frontendUrl.replaceAll("/+$", "") + "/shop/verify-email?token=" + rawToken;
        SimpleMailMessage message = new SimpleMailMessage();
        if (senderEmail != null && !senderEmail.isBlank()) message.setFrom(senderEmail);
        message.setTo(account.getEmail());
        message.setSubject("Xác minh email - WA Pâtisserie");
        message.setText("Xin chào " + account.getUsername() + ",\n\n"
                + "Vui lòng mở liên kết sau để xác minh email (liên kết hết hạn sau 30 phút):\n"
                + link + "\n\nNếu bạn không tạo tài khoản này, hãy bỏ qua email này.");
        afterCommitEmailSender.sendAfterCommit(message);
    }

    @Transactional
    public void verify(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liên kết xác minh không hợp lệ.");
        }
        Account account = accountRepository.findByEmailVerificationTokenHash(sha256(rawToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Liên kết xác minh không hợp lệ hoặc đã được sử dụng."));
        if (account.getEmailVerificationTokenExpiresAt() == null
                || !account.getEmailVerificationTokenExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Liên kết xác minh đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại email.");
        }
        account.setEmailVerified(true);
        account.setStatus("ACTIVE");
        account.setUpdatedAt(LocalDateTime.now());
        account.setEmailVerificationTokenHash(null);
        account.setEmailVerificationTokenExpiresAt(null);
        accountRepository.save(account);
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : digest) result.append(String.format("%02x", b));
            return result.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Không hỗ trợ SHA-256", ex);
        }
    }
}
