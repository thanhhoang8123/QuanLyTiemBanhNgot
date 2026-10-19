package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.EmailVerificationToken;
import com.nhom4.QuanLyTiemBanhNgot.repository.AccountRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmailVerificationTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
    private final JavaMailSender mailSender;
    private final AccountRepository accountRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public EmailVerificationService(JavaMailSender mailSender,
                                    AccountRepository accountRepository,
                                    EmailVerificationTokenRepository tokenRepository) {
        this.mailSender = mailSender;
        this.accountRepository = accountRepository;
        this.tokenRepository = tokenRepository;
    }

    @Transactional
    public void sendVerification(Account account) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        tokenRepository.deleteByAccountId(account.getId());
        EmailVerificationToken token = new EmailVerificationToken();
        token.setAccountId(account.getId());
        token.setTokenHash(sha256(rawToken));
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        tokenRepository.save(token);

        String link = frontendUrl.replaceAll("/+$", "") + "/shop/verify-email?token=" + rawToken;
        SimpleMailMessage message = new SimpleMailMessage();
        if (senderEmail != null && !senderEmail.isBlank()) message.setFrom(senderEmail);
        message.setTo(account.getEmail());
        message.setSubject("Xác minh email - WA Pâtisserie");
        message.setText("Xin chào " + account.getUsername() + ",

"
                + "Vui lòng mở liên kết sau để xác minh email (liên kết hết hạn sau 30 phút):
"
                + link + "

Nếu bạn không tạo tài khoản này, hãy bỏ qua email này.");
        mailSender.send(message);
    }

    @Transactional
    public void verify(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liên kết xác minh không hợp lệ.");
        }
        EmailVerificationToken token = tokenRepository.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Liên kết xác minh không hợp lệ hoặc đã được sử dụng."));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(token);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Liên kết xác minh đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại email.");
        }
        Account account = accountRepository.findById(token.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tài khoản không tồn tại."));
        account.setEmailVerified(true);
        account.setStatus("ACTIVE");
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);
        tokenRepository.delete(token);
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
