package com.nhom4.QuanLyTiemBanhNgot.service;

import java.util.Map;

public interface VnPayQueryClient {

    Map<String, String> query(Map<String, String> signedParameters);
}
