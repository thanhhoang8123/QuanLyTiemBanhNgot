package com.nhom4.QuanLyTiemBanhNgot.service;

import jakarta.servlet.http.HttpServletRequest;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class VnPayCallbackParameters {

    private VnPayCallbackParameters() {
    }

    public static Map<String, List<String>> from(HttpServletRequest request) {
        Map<String, List<String>> parameters = new LinkedHashMap<>();
        for (Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
            String name = entry.getKey();
            if (name == null || !name.startsWith("vnp_")) {
                continue;
            }
            String[] values = entry.getValue();
            if (values == null || values.length != 1 || values[0] == null) {
                throw new IllegalArgumentException("VNPay callback contains duplicate or invalid parameters");
            }
            parameters.put(name, List.of(values[0]));
        }
        return parameters;
    }
}
