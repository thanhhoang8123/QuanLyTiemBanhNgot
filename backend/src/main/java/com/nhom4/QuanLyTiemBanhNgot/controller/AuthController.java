package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.AccountResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.service.AuthService;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerRegistrationService;
import com.nhom4.QuanLyTiemBanhNgot.service.EmailVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String USER_SESSION_KEY = "AUTHENTICATED_ACCOUNT";
    private static final String CSRF_SESSION_KEY = "AUTH_CSRF_TOKEN";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthService authService;
    private final CustomerRegistrationService registrationService;
    private final EmailVerificationService emailVerificationService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(AuthService authService,
                          CustomerRegistrationService registrationService,
                          EmailVerificationService emailVerificationService,
                          AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository) {
        this.authService = authService;
        this.registrationService = registrationService;
        this.emailVerificationService = emailVerificationService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(HttpServletRequest request, CsrfToken csrfToken) {
        HttpSession session = request.getSession(true);
        // Resolve Spring's deferred token so the CSRF repository writes its cookie.
        csrfToken.getToken();
        return Map.of("csrfToken", getOrCreateCsrf(session));
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        registrationService.register(request.username(), request.password(), request.fullName(),
                request.email(), request.phone(), request.address());
        return ResponseEntity.accepted().body(new MessageResponse(
                "Tài khoản đã được tạo. Nếu chưa nhận được email xác minh, vui lòng yêu cầu gửi lại sau khi đủ thời gian chờ."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        emailVerificationService.resendVerification(request.email());
        return ResponseEntity.accepted().body(new MessageResponse(
                "Nếu email thuộc tài khoản đang chờ xác minh, hướng dẫn xác minh sẽ được gửi nếu đủ điều kiện."));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        emailVerificationService.verify(request.token());
        return ResponseEntity.ok(new MessageResponse("Xác minh email thành công. Bạn có thể đăng nhập."));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                               @RequestHeader(value = "X-CSRF-Token", required = false) String csrfToken,
                                               HttpServletRequest httpRequest,
                                               HttpServletResponse httpResponse) {
        HttpSession oldSession = httpRequest.getSession(true);
        requireValidCsrf(oldSession, csrfToken);
        Account account = authService.login(request.username(), request.password());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username().trim(), request.password())
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        // Rotate the session ID and token after successful login to reduce session-fixation risk.
        httpRequest.changeSessionId();
        HttpSession session = httpRequest.getSession(false);
        session.setAttribute(USER_SESSION_KEY, accountResponse(account));
        String nextCsrf = createCsrf();
        session.setAttribute(CSRF_SESSION_KEY, nextCsrf);
        return ResponseEntity.ok(new LoginResponse(accountResponse(account), nextCsrf));
    }

    @GetMapping("/me")
    public AccountResponse me(HttpSession session) {
        Object account = session.getAttribute(USER_SESSION_KEY);
        if (!(account instanceof AccountResponse response)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập");
        }
        return response;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session,
                                       @RequestHeader(value = "X-CSRF-Token", required = false) String csrfToken) {
        requireValidCsrf(session, csrfToken);
        SecurityContextHolder.clearContext();
        session.invalidate();
        return ResponseEntity.noContent().build();
    }

    private AccountResponse accountResponse(Account account) {
        return new AccountResponse(account.getId(), account.getUsername(), account.getRole().getId(),
                account.getRole().getName(), account.getRole().getRoleCode(), account.getStatus(),
                account.getCreatedAt(), account.getUpdatedAt());
    }

    private void requireValidCsrf(HttpSession session, String provided) {
        Object expected = session.getAttribute(CSRF_SESSION_KEY);
        if (!(expected instanceof String token) || provided == null || !constantTimeEquals(token, provided)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CSRF token không hợp lệ. Hãy tải lại trang và thử lại.");
        }
    }

    private String getOrCreateCsrf(HttpSession session) {
        Object token = session.getAttribute(CSRF_SESSION_KEY);
        if (token instanceof String value && !value.isBlank()) return value;
        String value = createCsrf();
        session.setAttribute(CSRF_SESSION_KEY, value);
        return value;
    }

    private String createCsrf() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private boolean constantTimeEquals(String expected, String provided) {
        return java.security.MessageDigest.isEqual(expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                provided.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public record LoginRequest(
            @NotBlank @Size(max = 50) String username,
            @NotBlank @Size(max = 72) String password) {}
    public record RegisterRequest(
            @NotBlank @Size(min = 4, max = 50) String username,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 100) String email,
            @Size(max = 15) String phone,
            @Size(max = 255) String address) {}
    public record MessageResponse(String message) {}
    public record VerifyEmailRequest(@NotBlank @Size(max = 100) String token) {}
    public record ResendVerificationRequest(@NotBlank @Email @Size(max = 100) String email) {}
    public record LoginResponse(AccountResponse account, String csrfToken) {}
}
