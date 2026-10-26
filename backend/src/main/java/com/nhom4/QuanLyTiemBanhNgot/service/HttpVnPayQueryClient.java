package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class HttpVnPayQueryClient implements VnPayQueryClient {

    private static final URI SANDBOX_QUERY_URI = URI.create(
            "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
    );

    private final VnPayProperties properties;
    private final RestClient restClient;

    public HttpVnPayQueryClient(VnPayProperties properties) {
        this.properties = properties;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public Map<String, String> query(Map<String, String> signedParameters) {
        URI queryUri = requireSandboxQueryUri(properties.getQueryUrl());
        Map<String, Object> requestBody = new LinkedHashMap<>(signedParameters);
        try {
            Map<String, Object> response = restClient.post()
                    .uri(queryUri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() { });
            if (response == null || response.isEmpty()) {
                throw new IllegalStateException("VNPay query returned an empty response");
            }
            Map<String, String> stringResponse = new LinkedHashMap<>();
            response.forEach((name, value) -> {
                if (value == null || !(value instanceof String || value instanceof Number)) {
                    throw new IllegalStateException("VNPay query returned invalid response data");
                }
                stringResponse.put(name, String.valueOf(value));
            });
            return Map.copyOf(stringResponse);
        } catch (RestClientException exception) {
            throw new IllegalStateException("Unable to query VNPay transaction status", exception);
        }
    }

    private URI requireSandboxQueryUri(String value) {
        try {
            URI uri = URI.create(value == null ? "" : value.trim());
            if (!SANDBOX_QUERY_URI.equals(uri)) {
                throw new IllegalStateException("VNPay query URL must use the Sandbox endpoint");
            }
            return uri;
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("VNPay query URL is invalid", exception);
        }
    }
}
