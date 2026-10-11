
package com.nhom4.QuanLyTiemBanhNgot.validation;

import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderCreateRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import com.nhom4.QuanLyTiemBanhNgot.entity.Supplier;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Locale;

public final class TV2ValidationUtils {

    private TV2ValidationUtils() {
    }

    private static void requireText(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + " không được để trống");
        }
    }

    private static void checkLength(String value, int max, String field) {
        if (value != null && value.trim().length() > max) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + " không được vượt quá " + max + " ký tự");
        }
    }

    private static void checkNonNegative(BigDecimal value, String field) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + " không được âm");
        }
    }

    private static void checkScale(
            BigDecimal value, int maxScale, String field) {
        if (value != null
                && value.stripTrailingZeros().scale() > maxScale) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + " chỉ được có tối đa " + maxScale
                            + " chữ số thập phân");
        }
    }

    private static String normalize(String value) {
        return value == null
                ? ""
                : value.trim().toLowerCase(Locale.ROOT);
    }

    // ==================== NGUYÊN LIỆU ====================

    public static void validateIngredient(Ingredient ingredient) {
        if (ingredient == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu nguyên liệu không được để trống");
        }

        requireText(ingredient.getIngredientCode(), "Mã nguyên liệu");
        requireText(ingredient.getName(), "Tên nguyên liệu");
        requireText(ingredient.getUnit(), "Đơn vị nguyên liệu");

        checkLength(ingredient.getIngredientCode(), 30, "Mã nguyên liệu");
        checkLength(ingredient.getName(), 150, "Tên nguyên liệu");
        checkLength(ingredient.getUnit(), 30, "Đơn vị nguyên liệu");

        checkNonNegative(
                ingredient.getStockQuantity(), "Số lượng tồn kho");
        checkNonNegative(
                ingredient.getMinStockLevel(), "Mức tồn kho tối thiểu");
        checkNonNegative(ingredient.getUnitPrice(), "Đơn giá");

        checkScale(
                ingredient.getStockQuantity(), 3, "Số lượng tồn kho");
        checkScale(
                ingredient.getMinStockLevel(), 3, "Mức tồn kho tối thiểu");
        checkScale(ingredient.getUnitPrice(), 2, "Đơn giá");
    }

    public static void validateIngredientDuplicate(
            Ingredient ingredient, Iterable<Ingredient> ingredients) {
        for (Ingredient existing : ingredients) {
            if (ingredient.getId() != null
                    && ingredient.getId().equals(existing.getId())) {
                continue;
            }

            if (normalize(existing.getIngredientCode())
                    .equals(normalize(ingredient.getIngredientCode()))) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Mã nguyên liệu đã tồn tại");
            }

            if (normalize(existing.getName())
                    .equals(normalize(ingredient.getName()))) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tên nguyên liệu đã tồn tại");
            }
        }
    }

    // ==================== NHÀ CUNG CẤP ====================

    public static void validateSupplier(Supplier supplier) {
        if (supplier == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu nhà cung cấp không được để trống");
        }

        requireText(supplier.getSupplierCode(), "Mã nhà cung cấp");
        requireText(supplier.getName(), "Tên nhà cung cấp");

        checkLength(supplier.getSupplierCode(), 30, "Mã nhà cung cấp");
        checkLength(supplier.getName(), 150, "Tên nhà cung cấp");
        checkLength(supplier.getPhone(), 15, "Số điện thoại");
        checkLength(supplier.getEmail(), 100, "Email");
        checkLength(supplier.getAddress(), 255, "Địa chỉ");

        if (supplier.getPhone() != null
                && !supplier.getPhone().trim().isEmpty()
                && !supplier.getPhone().trim()
                        .matches("[0-9+() -]{8,15}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điện thoại không hợp lệ");
        }

        if (supplier.getEmail() != null
                && !supplier.getEmail().trim().isEmpty()
                && !supplier.getEmail().trim().matches(
                        "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email không hợp lệ");
        }
    }

    public static void validateSupplierDuplicate(
            Supplier supplier, Iterable<Supplier> suppliers) {
        for (Supplier existing : suppliers) {
            if (supplier.getId() != null
                    && supplier.getId().equals(existing.getId())) {
                continue;
            }

            if (normalize(existing.getSupplierCode())
                    .equals(normalize(supplier.getSupplierCode()))) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Mã nhà cung cấp đã tồn tại");
            }

            if (normalize(existing.getName())
                    .equals(normalize(supplier.getName()))) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tên nhà cung cấp đã tồn tại");
            }
        }
    }

    // ==================== PHIẾU NHẬP ====================

    public static void validatePurchaseOrder(
            PurchaseOrderCreateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thông tin phiếu nhập không được để trống");
        }

        if (request.supplierId() == null
                || request.supplierId() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ID nhà cung cấp không hợp lệ");
        }

        if (request.employeeId() == null
                || request.employeeId() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ID nhân viên không hợp lệ");
        }

        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phiếu nhập phải có ít nhất một nguyên liệu");
        }

        for (PurchaseOrderCreateRequest.PurchaseOrderItemRequest item
                : request.items()) {
            validatePurchaseOrderItem(item);
        }
    }

    public static void validatePurchaseOrderItem(
            PurchaseOrderCreateRequest.PurchaseOrderItemRequest item) {
        if (item == null
                || item.ingredientId() == null
                || item.ingredientId() <= 0
                || item.quantity() == null
                || item.quantity().compareTo(BigDecimal.ZERO) <= 0
                || item.unitCost() == null
                || item.unitCost().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nguyên liệu, số lượng hoặc đơn giá không hợp lệ");
        }

        checkScale(item.quantity(), 3, "Số lượng");
        checkScale(item.unitCost(), 2, "Đơn giá");
    }

    public static void validateReceiveItem(
            Ingredient ingredient, BigDecimal quantity) {
        if (ingredient == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy nguyên liệu khi nhận hàng");
        }

        if (quantity == null
                || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng nhận phải lớn hơn 0");
        }
    }
}
