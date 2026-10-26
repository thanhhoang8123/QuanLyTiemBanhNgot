
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import com.nhom4.QuanLyTiemBanhNgot.repository.IngredientRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PurchaseOrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.validation.TV2ValidationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class IngredientService {

    private final IngredientRepository repository;
    private final PurchaseOrderItemRepository itemRepository;

    public IngredientService(
            IngredientRepository repository,
            PurchaseOrderItemRepository itemRepository) {
        this.repository = repository;
        this.itemRepository = itemRepository;
    }

    public List<Ingredient> findAll() {
        return repository.findAll();
    }

    public Ingredient findById(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "ID nguyên liệu không hợp lệ");
        }

        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy nguyên liệu"));
    }

    @Transactional
    public Ingredient save(Ingredient ingredient) {
        Ingredient existing = null;
        if (ingredient != null && ingredient.getId() != null) {
            existing = repository.findByIdForUpdate(ingredient.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Không tìm thấy nguyên liệu"));

            String existingUnit = existing.getUnit() == null
                    ? ""
                    : existing.getUnit().trim();
            String requestedUnit = ingredient.getUnit() == null
                    ? ""
                    : ingredient.getUnit().trim();
            boolean hasPurchaseHistory =
                    itemRepository.existsByIngredient_Id(existing.getId());
            boolean hasStock = existing.getStockQuantity() != null
                    && existing.getStockQuantity().compareTo(BigDecimal.ZERO) > 0;
            if ((hasPurchaseHistory || hasStock)
                    && !existingUnit.equalsIgnoreCase(requestedUnit)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không thể đổi đơn vị khi nguyên liệu còn tồn kho hoặc đã được phiếu nhập tham chiếu");
            }
            ingredient.setStockQuantity(existing.getStockQuantity());
        }

        TV2ValidationUtils.validateIngredient(ingredient);

        ingredient.setIngredientCode(ingredient.getIngredientCode().trim());
        ingredient.setName(ingredient.getName().trim());
        ingredient.setUnit(ingredient.getUnit().trim());

        TV2ValidationUtils.validateIngredientDuplicate(
                ingredient, repository.findAll());

        if (ingredient.getStatus() == null) {
            ingredient.setStatus(true);
        }

        return repository.save(ingredient);
    }

    @Transactional
    public void deleteById(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "ID nguyên liệu không hợp lệ");
        }
        Ingredient ingredient = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy nguyên liệu"));
        if (itemRepository.existsByIngredient_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa nguyên liệu đã được phiếu nhập tham chiếu; hãy ngừng hoạt động thay thế");
        }
        if (ingredient.getStockQuantity() != null
                && ingredient.getStockQuantity().compareTo(BigDecimal.ZERO) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa nguyên liệu còn tồn kho; hãy ngừng hoạt động thay thế");
        }
        repository.delete(ingredient);
    }
}
