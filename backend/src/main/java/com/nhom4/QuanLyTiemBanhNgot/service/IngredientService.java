
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import com.nhom4.QuanLyTiemBanhNgot.repository.IngredientRepository;
import com.nhom4.QuanLyTiemBanhNgot.validation.TV2ValidationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class IngredientService {

    private final IngredientRepository repository;

    public IngredientService(IngredientRepository repository) {
        this.repository = repository;
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
        TV2ValidationUtils.validateIngredient(ingredient);

        if (ingredient.getId() != null) {
            findById(ingredient.getId());
        }

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
        Ingredient ingredient = findById(id);
        repository.delete(ingredient);
    }
}
