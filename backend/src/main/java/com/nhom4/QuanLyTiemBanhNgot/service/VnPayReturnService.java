package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.config.VnPayProperties;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayReturnResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.PaymentTransactionAttempt;
import com.nhom4.QuanLyTiemBanhNgot.repository.PaymentTransactionAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.List;
import java.util.Map;

@Service
public class VnPayReturnService {

    private static final BigInteger MAX_VNPAY_AMOUNT = new BigInteger("999999999999");

    private final VnPayProperties properties;
    private final VnPaySignatureService signatureService;
    private final PaymentTransactionAttemptRepository attemptRepository;

    public VnPayReturnService(
            VnPayProperties properties,
            VnPaySignatureService signatureService,
            PaymentTransactionAttemptRepository attemptRepository) {
        this.properties = properties;
        this.signatureService = signatureService;
        this.attemptRepository = attemptRepository;
    }

    @Transactional(readOnly = true)
    public VnPayReturnResponse getResult(Map<String, List<String>> parameters) {
        if (!signatureService.hasValidCallbackSignature(parameters)
                || !hasSingleValue(parameters, "vnp_TmnCode")
                || !hasSingleValue(parameters, "vnp_TxnRef")
                || !hasSingleValue(parameters, "vnp_Amount")) {
            return invalid();
        }
        if (!StringUtils.hasText(properties.getTmnCode())
                || !properties.getTmnCode().trim()
                .equals(parameters.get("vnp_TmnCode").get(0))) {
            return invalid();
        }

        String txnRef = parameters.get("vnp_TxnRef").get(0);
        Long amount = parseAmount(parameters.get("vnp_Amount").get(0));
        if (!txnRef.matches("[A-Za-z0-9]{1,100}") || amount == null) {
            return invalid();
        }
        PaymentTransactionAttempt attempt = attemptRepository.findByTxnRef(txnRef)
                .orElse(null);
        if (attempt == null || !matchesAmount(amount, attempt)) {
            return invalid();
        }

        String attemptStatus = attempt.getStatus();
        String paymentStatus = attempt.getPayment().getStatus();
        if ("SUCCESS".equalsIgnoreCase(attemptStatus)
                && "SUCCESS".equalsIgnoreCase(paymentStatus)) {
            return new VnPayReturnResponse("SUCCESS", "Thanh toán đã được xác nhận");
        }
        if ("FAILED".equalsIgnoreCase(attemptStatus)
                && "FAILED".equalsIgnoreCase(paymentStatus)) {
            return new VnPayReturnResponse("FAILED", "Giao dịch thanh toán không thành công");
        }
        if ("RECONCILIATION_REQUIRED".equalsIgnoreCase(attemptStatus)) {
            return new VnPayReturnResponse(
                    "RECONCILIATION_REQUIRED",
                    "Giao dịch đang được kiểm tra; vui lòng liên hệ cửa hàng"
            );
        }
        return new VnPayReturnResponse(
                "PENDING_CONFIRMATION",
                "Chưa nhận được xác nhận thanh toán từ hệ thống"
        );
    }

    private boolean hasSingleValue(Map<String, List<String>> parameters, String name) {
        if (parameters == null) return false;
        List<String> values = parameters.get(name);
        return values != null && values.size() == 1 && StringUtils.hasText(values.get(0));
    }

    private Long parseAmount(String amount) {
        if (amount == null || !amount.matches("[0-9]{1,12}")) return null;
        try {
            BigInteger parsed = new BigInteger(amount);
            if (parsed.signum() <= 0 || parsed.compareTo(MAX_VNPAY_AMOUNT) > 0) return null;
            return parsed.longValueExact();
        } catch (ArithmeticException exception) {
            return null;
        }
    }

    private boolean matchesAmount(Long callbackAmount, PaymentTransactionAttempt attempt) {
        if (callbackAmount == null
                || attempt.getAmountVnd() == null
                || attempt.getAmountVnd() <= 0) {
            return false;
        }
        try {
            return callbackAmount == VnPaySignatureService.toVnPayAmount(
                    BigDecimal.valueOf(attempt.getAmountVnd()));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private VnPayReturnResponse invalid() {
        return new VnPayReturnResponse("INVALID", "Không thể xác minh kết quả thanh toán");
    }
}
