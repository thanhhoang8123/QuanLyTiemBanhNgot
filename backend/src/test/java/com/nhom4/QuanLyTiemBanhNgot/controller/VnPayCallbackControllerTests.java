package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayIpnResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.payment.VnPayReturnResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.VnPayIpnService;
import com.nhom4.QuanLyTiemBanhNgot.service.VnPayReturnService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VnPayCallbackControllerTests {

    @Test
    void appliesVerifiedReturnCallbackBeforeRedirectingToOrderResult() {
        VnPayIpnService ipnService = mock(VnPayIpnService.class);
        VnPayReturnService returnService = mock(VnPayReturnService.class);
        VnPayCallbackController controller = new VnPayCallbackController(
                ipnService, returnService, "https://shop.example.com");
        MockHttpServletRequest request = signedCallbackRequest();
        Map<String, List<String>> parameters = Map.of(
                "vnp_TxnRef", List.of("testreference"),
                "vnp_SecureHash", List.of("signed-value"));

        when(returnService.getResult(parameters))
                .thenReturn(new VnPayReturnResponse("PENDING_CONFIRMATION", "Pending"));
        when(ipnService.process(parameters))
                .thenReturn(new VnPayIpnResponse("00", "Confirm Success"));

        var response = controller.returnFromProvider(request);

        assertEquals(303, response.getStatusCode().value());
        assertEquals(
                "https://shop.example.com/shop/order-result?vnpayReturn=1&transactionReference=testreference",
                response.getHeaders().getLocation().toString());
        verify(ipnService).process(parameters);
    }

    @Test
    void doesNotProcessAnInvalidReturnCallback() {
        VnPayIpnService ipnService = mock(VnPayIpnService.class);
        VnPayReturnService returnService = mock(VnPayReturnService.class);
        VnPayCallbackController controller = new VnPayCallbackController(
                ipnService, returnService, "https://shop.example.com");
        MockHttpServletRequest request = signedCallbackRequest();
        Map<String, List<String>> parameters = Map.of(
                "vnp_TxnRef", List.of("testreference"),
                "vnp_SecureHash", List.of("signed-value"));

        when(returnService.getResult(parameters))
                .thenReturn(new VnPayReturnResponse("INVALID", "Invalid"));

        var response = controller.returnFromProvider(request);

        assertEquals(303, response.getStatusCode().value());
        assertEquals(
                "https://shop.example.com/shop/order-result?vnpayReturn=1",
                response.getHeaders().getLocation().toString());
        verify(ipnService, never()).process(anyMap());
    }

    private MockHttpServletRequest signedCallbackRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("vnp_TxnRef", "testreference");
        request.setParameter("vnp_SecureHash", "signed-value");
        return request;
    }
}
