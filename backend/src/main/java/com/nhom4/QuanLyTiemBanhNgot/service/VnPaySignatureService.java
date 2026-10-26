package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.Arrays;

@Service
public class VnPaySignatureService {

    private static final String VERSION = "2.1.0";
    private static final String SIGNATURE_ALGORITHM = "HmacSHA512";
    private static final long MAX_VNPAY_AMOUNT = 999_999_999_999L;
    private static final String[] REQUIRED_TRANSACTION_PARAMETERS = {
            "vnp_TxnRef",
            "vnp_OrderInfo",
            "vnp_OrderType",
            "vnp_Locale",
            "vnp_IpAddr",
            "vnp_CreateDate",
            "vnp_ExpireDate"
    };
    private static final String[] GENERATED_PARAMETER_NAMES = {
            "vnp_Version",
            "vnp_Command",
            "vnp_TmnCode",
            "vnp_Amount",
            "vnp_CurrCode",
            "vnp_BankCode",
            "vnp_ReturnUrl",
            "vnp_SecureHash",
            "vnp_SecureHashType"
    };

    private final VnPayProperties properties;

    public VnPaySignatureService(VnPayProperties properties) {
        this.properties = properties;
    }

    public String createQrPaymentUrl(
            Map<String, String> transactionParameters,
            BigDecimal amountVnd) {
        String secret = properties.requireHashSecret();
        long providerAmount = toVnPayAmount(amountVnd);
        TreeMap<String, String> parameters = normalizeTransactionParameters(transactionParameters);
        parameters.put("vnp_Version", VERSION);
        parameters.put("vnp_Command", "pay");
        parameters.put("vnp_TmnCode", requireConfiguredValue(
                properties.getTmnCode(), "VNPay TMN code is not configured"));
        parameters.put("vnp_Amount", Long.toString(providerAmount));
        parameters.put("vnp_CurrCode", "VND");
        // parameters.put("vnp_BankCode", "VNPAYQR");
        parameters.put("vnp_ReturnUrl", requireConfiguredValue(
                properties.getReturnUrl(), "VNPay return URL is not configured"));

        validateRequiredTransactionParameters(parameters);
        String paymentUrl = requirePaymentUrl(properties.getPaymentUrl());
        String query = toEncodedQuery(parameters);
        String signature = hmacSha512Hex(query, secret);

        return paymentUrl + (paymentUrl.contains("?") ? "&" : "?")
                + query + "&vnp_SecureHash=" + signature;
    }

    public boolean hasValidCallbackSignature(
            Map<String, List<String>> callbackParameters) {
        String secret = properties.requireHashSecret();
        if (callbackParameters == null || callbackParameters.isEmpty()) {
            return false;
        }

        String suppliedSignature = null;
        TreeMap<String, String> signedParameters = new TreeMap<>();
        for (Map.Entry<String, List<String>> entry : callbackParameters.entrySet()) {
            String name = entry.getKey();
            if (name == null || !name.startsWith("vnp_")) {
                continue;
            }
            List<String> values = entry.getValue();
            if (values == null || values.size() != 1 || values.get(0) == null) {
                return false;
            }
            String value = values.get(0);
            if ("vnp_SecureHash".equals(name)) {
                suppliedSignature = value;
            } else if (!"vnp_SecureHashType".equals(name)) {
                signedParameters.put(name, value);
            }
        }

        if (suppliedSignature == null || !isSha512Hex(suppliedSignature)) {
            return false;
        }

        String canonicalData = toEncodedQuery(signedParameters);
        String expectedSignature = hmacSha512Hex(canonicalData, secret);
        return constantTimeHexEquals(expectedSignature, suppliedSignature);
    }

    public String signQueryRequest(Map<String, String> parameters) {
        String secret = properties.requireHashSecret();
        String canonicalData = String.join("|",
                required(parameters, "vnp_RequestId"),
                required(parameters, "vnp_Version"),
                required(parameters, "vnp_Command"),
                required(parameters, "vnp_TmnCode"),
                required(parameters, "vnp_TxnRef"),
                required(parameters, "vnp_TransactionDate"),
                required(parameters, "vnp_CreateDate"),
                required(parameters, "vnp_IpAddr"),
                required(parameters, "vnp_OrderInfo"));
        return hmacSha512Hex(canonicalData, secret);
    }

    public boolean hasValidQueryResponseSignature(Map<String, String> parameters) {
        if (parameters == null || !isSha512Hex(parameters.get("vnp_SecureHash"))) {
            return false;
        }
        String[] signedFields = {
                "vnp_ResponseId",
                "vnp_Command",
                "vnp_ResponseCode",
                "vnp_Message",
                "vnp_TmnCode",
                "vnp_TxnRef",
                "vnp_Amount",
                "vnp_BankCode",
                "vnp_PayDate",
                "vnp_TransactionNo",
                "vnp_TransactionType",
                "vnp_TransactionStatus",
                "vnp_OrderInfo",
                "vnp_PromotionCode",
                "vnp_PromotionAmount"
        };
        String canonicalData = Arrays.stream(signedFields)
                .map(name -> parameters.getOrDefault(name, ""))
                .reduce((left, right) -> left + "|" + right)
                .orElse("");
        String expected = hmacSha512Hex(canonicalData, properties.requireHashSecret());
        return constantTimeHexEquals(expected, parameters.get("vnp_SecureHash"));
    }

    public static long toVnPayAmount(BigDecimal amountVnd) {
        if (amountVnd == null || amountVnd.signum() <= 0) {
            throw new IllegalArgumentException("VNPay amount must be greater than zero");
        }

        try {
            long wholeVnd = amountVnd.setScale(0, RoundingMode.UNNECESSARY).longValueExact();
            long providerAmount = Math.multiplyExact(wholeVnd, 100L);
            if (providerAmount > MAX_VNPAY_AMOUNT) {
                throw new IllegalArgumentException("VNPay amount exceeds the supported limit");
            }
            return providerAmount;
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException(
                    "VNPay amount must be a whole VND value within the supported limit",
                    exception
            );
        }
    }

    static boolean constantTimeHexEquals(String expectedHex, String suppliedHex) {
        if (!isSha512Hex(expectedHex) || !isSha512Hex(suppliedHex)) {
            return false;
        }
        return MessageDigest.isEqual(
                decodeHex(expectedHex),
                decodeHex(suppliedHex)
        );
    }

    private TreeMap<String, String> normalizeTransactionParameters(
            Map<String, String> transactionParameters) {
        if (transactionParameters == null) {
            throw new IllegalArgumentException("VNPay transaction parameters are required");
        }
        TreeMap<String, String> parameters = new TreeMap<>();
        for (Map.Entry<String, String> entry : transactionParameters.entrySet()) {
            String name = entry.getKey();
            String value = entry.getValue();
            if (name == null || !name.startsWith("vnp_") || value == null) {
                throw new IllegalArgumentException("Invalid VNPay transaction parameter");
            }
            if (isGeneratedParameter(name)) {
                throw new IllegalArgumentException(
                        "Generated VNPay parameters must not be supplied by the caller"
                );
            }
            if (parameters.putIfAbsent(name, value) != null) {
                throw new IllegalArgumentException("Duplicate VNPay transaction parameter");
            }
        }
        validateRequiredTransactionParameters(parameters);
        return parameters;
    }

    private void validateRequiredTransactionParameters(Map<String, String> parameters) {
        for (String name : REQUIRED_TRANSACTION_PARAMETERS) {
            if (parameters.get(name) == null || parameters.get(name).isBlank()) {
                throw new IllegalArgumentException(
                        "Required VNPay transaction parameter is missing: " + name
                );
            }
        }
    }

    private boolean isGeneratedParameter(String name) {
        for (String generatedName : GENERATED_PARAMETER_NAMES) {
            if (generatedName.equals(name)) {
                return true;
            }
        }
        return false;
    }

    private String requirePaymentUrl(String value) {
        String paymentUrl = requireConfiguredValue(
                value, "VNPay payment URL is not configured");
        try {
            URI uri = URI.create(paymentUrl);
            if (!("https".equalsIgnoreCase(uri.getScheme())
                    || "http".equalsIgnoreCase(uri.getScheme()))
                    || uri.getHost() == null
                    || uri.getRawFragment() != null) {
                throw new IllegalStateException("VNPay payment URL must be an absolute HTTP URL");
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("VNPay payment URL is invalid", exception);
        }
        return paymentUrl;
    }

    private String requireConfiguredValue(String value, String errorMessage) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(errorMessage);
        }
        return value.trim();
    }

    private String required(Map<String, String> parameters, String name) {
        String value = parameters == null ? null : parameters.get(name);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    "Required VNPay query parameter is missing: " + name
            );
        }
        return value;
    }

    private String toEncodedQuery(Map<String, String> parameters) {
        List<String> encodedParameters = new ArrayList<>(parameters.size());
        for (Map.Entry<String, String> entry : parameters.entrySet()) {
            encodedParameters.add(
                    formUrlEncode(entry.getKey()) + "=" + formUrlEncode(entry.getValue()));
        }
        return String.join("&", encodedParameters);
    }

    static String hmacSha512Hex(String canonicalData, String secret) {
        try {
            Mac mac = Mac.getInstance(SIGNATURE_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), SIGNATURE_ALGORITHM));
            return encodeHex(mac.doFinal(canonicalData.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to create VNPay signature", exception);
        }
    }

    private String formUrlEncode(String value) {
        ByteArrayOutputStream encoded = new ByteArrayOutputStream();
        for (byte valueByte : value.getBytes(StandardCharsets.UTF_8)) {
            int unsignedByte = valueByte & 0xff;
            if (isFormUrlSafe(unsignedByte)) {
                encoded.write(unsignedByte);
            } else if (unsignedByte == ' ') {
                encoded.write('+');
            } else {
                encoded.write('%');
                encoded.write(toUpperHex(unsignedByte >>> 4));
                encoded.write(toUpperHex(unsignedByte & 0x0f));
            }
        }
        return encoded.toString(StandardCharsets.US_ASCII);
    }

    private boolean isFormUrlSafe(int value) {
        return (value >= 'a' && value <= 'z')
                || (value >= 'A' && value <= 'Z')
                || (value >= '0' && value <= '9')
                || value == '-'
                || value == '_'
                || value == '.';
    }

    private int toUpperHex(int value) {
        return value < 10 ? '0' + value : 'A' + value - 10;
    }

    private static boolean isSha512Hex(String value) {
        return value != null && value.matches("[0-9a-fA-F]{128}");
    }

    private static byte[] decodeHex(String value) {
        byte[] decoded = new byte[value.length() / 2];
        for (int index = 0; index < decoded.length; index++) {
            int high = Character.digit(value.charAt(index * 2), 16);
            int low = Character.digit(value.charAt(index * 2 + 1), 16);
            decoded[index] = (byte) ((high << 4) | low);
        }
        return decoded;
    }

    private static String encodeHex(byte[] value) {
        char[] digits = "0123456789abcdef".toCharArray();
        char[] encoded = new char[value.length * 2];
        for (int index = 0; index < value.length; index++) {
            int unsignedByte = value[index] & 0xff;
            encoded[index * 2] = digits[unsignedByte >>> 4];
            encoded[index * 2 + 1] = digits[unsignedByte & 0x0f];
        }
        return new String(encoded);
    }
}
