package com.nhom4.QuanLyTiemBanhNgot.config;

import com.nhom4.QuanLyTiemBanhNgot.controller.AuthController;
import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import com.nhom4.QuanLyTiemBanhNgot.entity.Role;
import com.nhom4.QuanLyTiemBanhNgot.service.AuthService;
import com.nhom4.QuanLyTiemBanhNgot.service.CustomerRegistrationService;
import com.nhom4.QuanLyTiemBanhNgot.service.DatabaseUserDetailsService;
import com.nhom4.QuanLyTiemBanhNgot.service.EmailVerificationService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@org.springframework.test.context.TestPropertySource(properties = {
        "app.frontend-url=https://quanlytiembanhngot.onrender.com",
        "server.servlet.session.cookie.same-site=None",
        "server.servlet.session.cookie.secure=true"
})
class AuthSecurityWebTests {

    private static final String ORIGIN = "https://quanlytiembanhngot.onrender.com";
    private static final String PASSWORD = "Test-only-Password-123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DatabaseUserDetailsService userDetailsService;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CustomerRegistrationService registrationService;

    @MockitoBean
    private EmailVerificationService emailVerificationService;

    @Test
    void csrfEndpointAndCredentialedPreflightWorkForConfiguredOrigin() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf").header("Origin", ORIGIN))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(body.path("csrfToken").asText().length() >= 32);
        assertEquals(ORIGIN, result.getResponse().getHeader("Access-Control-Allow-Origin"));
        assertEquals("true", result.getResponse().getHeader("Access-Control-Allow-Credentials"));
        Cookie csrfCookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(csrfCookie);
        assertEquals("None", csrfCookie.getAttribute("SameSite"));
        assertTrue(csrfCookie.getSecure());
        assertEquals("/", csrfCookie.getPath());

        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", ORIGIN)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,x-csrf-token,x-xsrf-token"))
                .andExpect(status().isOk())
                .andExpect(result1 -> assertEquals(ORIGIN,
                        result1.getResponse().getHeader("Access-Control-Allow-Origin")))
                .andExpect(result1 -> assertEquals("true",
                        result1.getResponse().getHeader("Access-Control-Allow-Credentials")));

        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "https://attacker.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousMeReturns401AndInsufficientRoleRemains403() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Origin", ORIGIN))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/accounts").with(user("staff01").roles("STAFF")))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginMeAndLogoutPreserveSessionAndSynchronizedCsrfToken() throws Exception {
        when(userDetailsService.loadUserByUsername("staff01"))
                .thenReturn(User.withUsername("staff01")
                        .password(passwordEncoder.encode(PASSWORD))
                        .roles("STAFF")
                        .build());
        when(authService.login("staff01", PASSWORD)).thenReturn(staffAccount());

        MvcResult csrf = mockMvc.perform(get("/api/auth/csrf").header("Origin", ORIGIN))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) csrf.getRequest().getSession(false);
        Cookie csrfCookie = csrf.getResponse().getCookie("XSRF-TOKEN");
        String csrfToken = objectMapper.readTree(csrf.getResponse().getContentAsString())
                .path("csrfToken").asText();
        assertNotNull(session);
        assertNotNull(csrfCookie);

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .session(session)
                        .cookie(csrfCookie)
                        .header("Origin", ORIGIN)
                        .header("X-CSRF-Token", csrfToken)
                        .header("X-XSRF-TOKEN", csrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"staff01\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode loginBody = objectMapper.readTree(login.getResponse().getContentAsString());
        String nextToken = loginBody.path("csrfToken").asText();
        Cookie nextCookie = login.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(nextCookie);
        assertEquals(nextToken, nextCookie.getValue());

        mockMvc.perform(get("/api/auth/me").session(session).header("Origin", ORIGIN))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"username\":\"staff01\"")));

        mockMvc.perform(post("/api/auth/logout")
                        .session(session)
                        .cookie(nextCookie)
                        .header("Origin", ORIGIN)
                        .header("X-CSRF-Token", nextToken)
                        .header("X-XSRF-TOKEN", nextToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/auth/me").session(session).header("Origin", ORIGIN))
                .andExpect(status().isUnauthorized());
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
