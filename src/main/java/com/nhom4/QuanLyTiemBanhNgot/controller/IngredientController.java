package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import com.nhom4.QuanLyTiemBanhNgot.service.IngredientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
public class IngredientController {

    private final IngredientService service;

    public IngredientController(IngredientService service) {
        this.service = service;
    }

    @GetMapping
    public List<Ingredient> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Ingredient findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Ingredient create(@RequestBody Ingredient ingredient) {
        return service.save(ingredient);
    }

    @PutMapping("/{id}")
    public Ingredient update(@PathVariable Long id, @RequestBody Ingredient ingredient) {
        ingredient.setId(id);
        return service.save(ingredient);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}