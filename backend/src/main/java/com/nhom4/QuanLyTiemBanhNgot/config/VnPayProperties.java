package com.nhom4.QuanLyTiemBanhNgot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "vnpay")
public class VnPayProperties {

    private String tmnCode;
    private String hashSecret;
    private String paymentUrl;
    private String queryUrl;
    private String returnUrl;
    private String ipnUrl;

    public String getTmnCode() {
        return tmnCode;
    }

    public void setTmnCode(String tmnCode) {
        this.tmnCode = tmnCode;
    }

    public String getHashSecret() {
        return hashSecret;
    }

    public void setHashSecret(String hashSecret) {
        this.hashSecret = hashSecret;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public void setPaymentUrl(String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }

    public String getQueryUrl() {
        return queryUrl;
    }

    public void setQueryUrl(String queryUrl) {
        this.queryUrl = queryUrl;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public String getIpnUrl() {
        return ipnUrl;
    }

    public void setIpnUrl(String ipnUrl) {
        this.ipnUrl = ipnUrl;
    }

    public String requireHashSecret() {
        if (!StringUtils.hasText(hashSecret)) {
            throw new IllegalStateException(
                    "VNPAY_HASH_SECRET must be configured before starting a VNPay payment"
            );
        }
        return hashSecret.trim();
    }
}
