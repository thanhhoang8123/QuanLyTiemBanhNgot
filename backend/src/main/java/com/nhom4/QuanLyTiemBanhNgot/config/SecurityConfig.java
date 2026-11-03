package com.nhom4.QuanLyTiemBanhNgot.config;

import com.nhom4.QuanLyTiemBanhNgot.service.DatabaseUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final DatabaseUserDetailsService userDetailsService;

    public SecurityConfig(DatabaseUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository(
            @Value("${server.servlet.session.cookie.same-site:Lax}") String sameSite,
            @Value("${server.servlet.session.cookie.secure:false}") boolean secure) {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(cookie -> cookie
                .path("/")
                .sameSite(sameSite)
                .secure(secure));
        return repository;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl.trim()));
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Accept", "Content-Type", "X-CSRF-Token", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SecurityContextRepository securityContextRepository,
            CookieCsrfTokenRepository csrfTokenRepository) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
            )
            .securityContext(context -> context.securityContextRepository(securityContextRepository))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .exceptionHandling(exception -> exception.authenticationEntryPoint((request, response, authException) -> {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"message\":\"Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.\"}");
            }).accessDeniedHandler((request, response, accessDeniedException) -> {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"message\":\"Bạn không có quyền thực hiện thao tác này.\"}");
            }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/api/auth/csrf",
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/verify-email",
                    "/api/auth/resend-verification"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/shop/newsletter"
                ).permitAll()
                .requestMatchers(
                    "/api/shop/contact",
                    "/api/shop/contact/**"
                ).authenticated()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/products",
                    "/api/products/**",
                    "/api/categories",
                    "/api/categories/**",
                    "/api/promotions",
                    "/api/promotions/**",
                    "/api/promotion-products",
                    "/api/promotion-products/**"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/payments/vnpay/ipn",
                    "/api/payments/vnpay/return"
                ).permitAll()
                .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
                .requestMatchers("/api/customer/profile").hasAnyRole("CUSTOMER", "ADMIN", "MANAGER", "STAFF")
                .requestMatchers(
                    "/api/customer/orders",
                    "/api/customer/orders/**"
                ).hasAnyRole("CUSTOMER", "ADMIN", "MANAGER", "STAFF")
                .requestMatchers(
                    "/api/customer/payments",
                    "/api/customer/payments/**"
                ).hasAnyRole("CUSTOMER", "ADMIN", "MANAGER", "STAFF")
                .requestMatchers(
                    "/api/custom-orders/customer",
                    "/api/custom-orders/customer/**"
                ).authenticated()
                .requestMatchers(
                    "/api/contact-messages",
                    "/api/contact-messages/**"
                ).hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers(
                    "/api/dashboard",
                    "/api/dashboard/**"
                ).hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers(
                    "/api/management/logs",
                    "/api/management/logs/**"
                ).hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/employees/options")
                    .hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers(
                    "/api/roles",
                    "/api/roles/**",
                    "/api/employees",
                    "/api/employees/**"
                ).hasRole("ADMIN")
                .requestMatchers(
                    "/api/accounts",
                    "/api/accounts/**"
                ).hasRole("ADMIN")
                .requestMatchers(
                    "/api/suppliers",
                    "/api/suppliers/**",
                    "/api/purchase-orders",
                    "/api/purchase-orders/**",
                    "/api/purchase-order-items",
                    "/api/purchase-order-items/**",
                    "/api/promotions",
                    "/api/promotions/**",
                    "/api/promotion-products",
                    "/api/promotion-products/**"
                ).hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(
                    "/api/ingredients",
                    "/api/ingredients/**",
                    "/api/products",
                    "/api/products/**",
                    "/api/categories",
                    "/api/categories/**",
                    "/api/uploads",
                    "/api/uploads/**",
                    "/api/customers",
                    "/api/customers/**",
                    "/api/orders",
                    "/api/orders/**",
                    "/api/order-items",
                    "/api/order-items/**",
                    "/api/payments",
                    "/api/payments/**",
                    "/api/custom-orders",
                    "/api/custom-orders/**"
                ).hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers("/api/**").denyAll()
                .anyRequest().permitAll()
            )
            .authenticationProvider(authenticationProvider())
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
