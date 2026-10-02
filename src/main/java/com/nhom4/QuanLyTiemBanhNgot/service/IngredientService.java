package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import com.nhom4.QuanLyTiemBanhNgot.repository.IngredientRepository;
import org.springframework.stereotype.Service;

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
        return repository.findById(id).orElse(null);
    }

    public Ingredient save(Ingredient ingredient) {
        return repository.save(ingredient);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}