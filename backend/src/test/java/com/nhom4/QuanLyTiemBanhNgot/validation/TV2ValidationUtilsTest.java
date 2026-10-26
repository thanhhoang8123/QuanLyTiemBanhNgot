package com.nhom4.QuanLyTiemBanhNgot.validation;

import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderCreateRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TV2ValidationUtilsTest {

    @Test
    void acceptsPurchaseOrderAmountsWithinDatabasePrecision() {
        PurchaseOrderCreateRequest request = new PurchaseOrderCreateRequest(
                1L,
                1L,
                List.of(new PurchaseOrderCreateRequest.PurchaseOrderItemRequest(
                        1L,
                        new BigDecimal("0.125"),
                        new BigDecimal("1250.50"))));

        assertDoesNotThrow(
                () -> TV2ValidationUtils.validatePurchaseOrder(request));
    }

    @Test
    void rejectsPurchaseOrderQuantityThatExceedsDatabasePrecision() {
        PurchaseOrderCreateRequest request = new PurchaseOrderCreateRequest(
                1L,
                1L,
                List.of(new PurchaseOrderCreateRequest.PurchaseOrderItemRequest(
                        1L,
                        new BigDecimal("1000000000000"),
                        BigDecimal.ONE)));

        assertThrows(
                ResponseStatusException.class,
                () -> TV2ValidationUtils.validatePurchaseOrder(request));
    }

    @Test
    void rejectsReceivingQuantityThatWouldOverflowIngredientStock() {
        Ingredient ingredient = new Ingredient();
        ingredient.setStockQuantity(new BigDecimal("999999999999.000"));

        assertThrows(
                ResponseStatusException.class,
                () -> TV2ValidationUtils.validateReceiveItem(
                        ingredient, BigDecimal.ONE));
    }

    @Test
    void rejectsIngredientsWithMissingNumericValues() {
        Ingredient ingredient = new Ingredient();
        ingredient.setIngredientCode("ING-1");
        ingredient.setName("Bột mì");
        ingredient.setUnit("kg");
        ingredient.setMinStockLevel(BigDecimal.ZERO);
        ingredient.setUnitPrice(BigDecimal.ZERO);

        assertThrows(
                ResponseStatusException.class,
                () -> TV2ValidationUtils.validateIngredient(ingredient));
    }
}
