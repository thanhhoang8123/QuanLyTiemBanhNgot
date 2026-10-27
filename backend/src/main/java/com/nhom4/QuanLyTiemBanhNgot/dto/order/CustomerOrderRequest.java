package com.nhom4.QuanLyTiemBanhNgot.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CustomerOrderRequest(
        @Size(max = 255, message = "Địa chỉ giao hàng không được vượt quá 255 ký tự")
        String deliveryAddress,

        @NotEmpty(message = "Đơn hàng phải có ít nhất một dòng sản phẩm")
        List<@Valid CreateOrderItemRequest> items,

        @Size(max = 30, message = "Mã khuyến mãi không được vượt quá 30 ký tự")
        String promotionCode,

        @Size(max = 500, message = "Ghi chú đơn hàng không được vượt quá 500 ký tự")
        String note,

        @Pattern(
                regexp = "^0(?:32|33|34|35|36|37|38|39|52|56|58|59|70|76|77|78|79|81|82|83|84|85|86|88|89|90|91|92|93|94|96|97|98|99)[0-9]{7}$",
                message = "Số điện thoại phải là số di động Việt Nam hợp lệ"
        )
        String phone
) {
}
