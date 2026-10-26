package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayIpnResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayReturnResponse;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.service.VnPayCallbackParameters;
import com.nhom4.QuanLyTiemBanhNgot.service.VnPayIpnService;
import com.nhom4.QuanLyTiemBanhNgot.service.VnPayReturnService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
public class VnPayCallbackController {

    private static final Logger logger =
            LoggerFactory.getLogger(VnPayCallbackController.class);

    private final VnPayIpnService ipnService;
    private final VnPayReturnService returnService;
    private final String frontendUrl;

    public VnPayCallbackController(
            VnPayIpnService ipnService,
            VnPayReturnService returnService,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.ipnService = ipnService;
        this.returnService = returnService;
        this.frontendUrl = frontendUrl;
    }

    @GetMapping("/ipn")
    public ResponseEntity<VnPayIpnResponse> ipn(HttpServletRequest request) {
        Map<String, List<String>> parameters;
        try {
            parameters = VnPayCallbackParameters.from(request);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.ok(new VnPayIpnResponse("99", "Invalid callback data"));
        }
        try {
            return ResponseEntity.ok(ipnService.process(parameters));
        } catch (DataAccessException
                 | IllegalStateException
                 | ConflictException
                 | ResourceNotFoundException exception) {
            logger.warn("VNPay IPN processing failed; returning retryable response");
            return ResponseEntity.ok(new VnPayIpnResponse("99", "Processing error"));
        }
    }

    @GetMapping("/return")
    public ResponseEntity<Void> returnFromProvider(
            HttpServletRequest request) {
        String transactionReference = null;
        try {
            Map<String, List<String>> parameters =
                    VnPayCallbackParameters.from(request);
            VnPayReturnResponse result = returnService.getResult(parameters);
            if (!"INVALID".equals(result.status())) {
                List<String> references = parameters.get("vnp_TxnRef");
                if (references != null && references.size() == 1) {
                    transactionReference = references.get(0);
                }
            }
        } catch (IllegalArgumentException | DataAccessException | IllegalStateException exception) {
            logger.warn("VNPay Return validation failed; redirecting without a transaction reference");
        }

        URI redirectUri = buildFrontendResultUri(transactionReference);
        return ResponseEntity.status(HttpStatus.SEE_OTHER)
                .location(redirectUri)
                .build();
    }

    private URI buildFrontendResultUri(String transactionReference) {
        URI configuredFrontend;
        try {
            configuredFrontend = URI.create(frontendUrl.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Configured frontend URL is invalid", exception);
        }
        String scheme = configuredFrontend.getScheme();
        if (!("https".equalsIgnoreCase(scheme)
                || "http".equalsIgnoreCase(scheme))
                || configuredFrontend.getHost() == null
                || configuredFrontend.getRawUserInfo() != null
                || configuredFrontend.getRawQuery() != null
                || configuredFrontend.getRawFragment() != null) {
            throw new IllegalStateException("Configured frontend URL is invalid");
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromUri(configuredFrontend)
                .path("/shop/order-result")
                .queryParam("vnpayReturn", "1");
        if (transactionReference != null
                && transactionReference.matches("[A-Za-z0-9]{1,100}")) {
            builder.queryParam("transactionReference", transactionReference);
        }
        return builder.build().encode().toUri();
    }
}
