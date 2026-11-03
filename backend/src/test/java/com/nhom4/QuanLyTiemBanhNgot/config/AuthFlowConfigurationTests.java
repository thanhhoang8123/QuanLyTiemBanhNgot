package com.nhom4.QuanLyTiemBanhNgot.config;

import com.nhom4.QuanLyTiemBanhNgot.controller.AuthController;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Role;
import com.nhom4.QuanLyTiemBanhNgot.service.AuthService;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerRegistrationService;
import com.nhom4.QuanLyTiemBanhNgot.service.EmailVerificationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthFlowConfigurationTests {

    private static final String FRONTEND_ORIGIN = "https://quanlytiembanhngot.onrender.com";

    @Test
    void corsAllowsCredentialsOnlyForConfiguredFrontendOrigin() {
        CorsConfigurationSource source = new SecurityConfig(null).corsConfigurationSource(FRONTEND_ORIGIN);
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
        CorsConfiguration cors = source.getCorsConfiguration(request);

        assertEquals(FRONTEND_ORIGIN, cors.checkOrigin(FRONTEND_ORIGIN));
        assertNull(cors.checkOrigin("https://attacker.example"));
        assertTrue(cors.getAllowCredentials());
        assertTrue(cors.checkHeaders(List.of("Content-Type", "X-CSRF-Token", "X-XSRF-TOKEN")).size() == 3);
    }

    @Test
    void csrfCookieIsReadableByTheFrontendWhenConfiguredAsCrossSiteSecureCookie() {
        CookieCsrfTokenRepository repository = new SecurityConfig(null).csrfTokenRepository("None", true);
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        CsrfToken csrfToken = repository.generateToken(request);
        repository.saveToken(csrfToken, request, response);

        String cookie = response.getHeader("Set-Cookie");
        assertTrue(cookie.contains("XSRF-TOKEN="));
        assertTrue(cookie.contains("Path=/"));
        Cookie csrfCookie = response.getCookie("XSRF-TOKEN");
        assertEquals("None", csrfCookie.getAttribute("SameSite"));
        assertTrue(csrfCookie.getSecure());

        String value = cookie.substring(cookie.indexOf('=') + 1, cookie.indexOf(';'));
        request.setCookies(new Cookie("XSRF-TOKEN", value));
        assertEquals(csrfToken.getToken(), repository.loadToken(request).getToken());
    }

    @Test
    void anonymousMeHasExplicitUnauthorizedResponse() {
        AuthController controller = controller(mock(AuthService.class), mock(AuthenticationManager.class),
                mock(SecurityContextRepository.class), mock(CookieCsrfTokenRepository.class));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> controller.me(new MockHttpSession()));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    }

    @Test
    void csrfEndpointReturnsSpringTokenAndStoresItInTheSession() {
        AuthController controller = controller(mock(AuthService.class), mock(AuthenticationManager.class),
                mock(SecurityContextRepository.class), mock(CookieCsrfTokenRepository.class));
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();
        request.setSession(session);
        CsrfToken token = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "csrf-token-from-repository");

        var response = controller.csrf(request, token);

        assertEquals("csrf-token-from-repository", response.get("csrfToken"));
        assertEquals("csrf-token-from-repository", session.getAttribute("AUTH_CSRF_TOKEN"));
    }

    @Test
    void loginRotatesSessionAndCookieCsrfTokenThenLogoutInvalidatesSession() throws Exception {
        AuthService authService = mock(AuthService.class);
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        SecurityContextRepository securityContextRepository = mock(SecurityContextRepository.class);
        CookieCsrfTokenRepository csrfRepository = mock(CookieCsrfTokenRepository.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);
        String oldToken = "old-token";
        String nextToken = "rotated-token";

        when(request.getSession(true)).thenReturn(session);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute("AUTH_CSRF_TOKEN")).thenReturn(oldToken);
        when(authService.login("staff01", "test-password")).thenReturn(staffAccount());
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                "staff01", null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        when(authenticationManager.authenticate(org.mockito.ArgumentMatchers.any(Authentication.class)))
                .thenReturn(authentication);
        CsrfToken nextCsrf = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", nextToken);
        when(csrfRepository.generateToken(request)).thenReturn(nextCsrf);

        AuthController controller = controller(authService, authenticationManager,
                securityContextRepository, csrfRepository);
        AuthController.LoginResponse loginResponse = controller.login(
                new AuthController.LoginRequest("staff01", "test-password"),
                oldToken, oldToken, request, response).getBody();

        assertEquals(nextToken, loginResponse.csrfToken());
        verify(session).setAttribute("AUTH_CSRF_TOKEN", nextToken);
        verify(csrfRepository).saveToken(nextCsrf, request, response);

        when(session.getAttribute("AUTH_CSRF_TOKEN")).thenReturn(nextToken);
        controller.logout(session, nextToken, nextToken, request, response);
        verify(session).invalidate();
        verify(csrfRepository).saveToken(null, request, response);
    }

    private AuthController controller(AuthService authService,
                                      AuthenticationManager authenticationManager,
                                      SecurityContextRepository securityContextRepository,
                                      CookieCsrfTokenRepository csrfRepository) {
        return new AuthController(authService,
                mock(CustomerRegistrationService.class),
                mock(EmailVerificationService.class),
                authenticationManager,
                securityContextRepository,
                csrfRepository);
    }

    private Account staffAccount() {
        Role role = new Role();
        role.setId(3L);
        role.setName("Nhân viên");
        role.setRoleCode("STAFF");
        Account account = new Account();
        account.setId(7L);
        account.setUsername("staff01");
        account.setRole(role);
        account.setStatus("ACTIVE");
        return account;
    }
}
