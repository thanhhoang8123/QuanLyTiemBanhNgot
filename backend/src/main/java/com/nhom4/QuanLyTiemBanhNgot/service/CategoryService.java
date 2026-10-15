
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Category;
import com.nhom4.QuanLyTiemBanhNgot.repository.CategoryRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getById(Long id) {
        return categoryRepository.findById(id);
    }

    public Category save(Category category) {
        validateCategory(category);

        if (category.getStatus() == null) {
            category.setStatus(true);
        }

        return categoryRepository.save(category);
    }

    public Category update(Long id, Category category) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));

        validateCategory(category);

        existing.setName(category.getName().trim());
        existing.setDescription(category.getDescription());

        if (category.getStatus() != null) {
            existing.setStatus(category.getStatus());
        }

        return categoryRepository.save(existing);
    }

    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));

        if (productRepository.existsByCategory_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Danh mục đang được sản phẩm sử dụng, không thể xóa");
        }

        categoryRepository.delete(category);
    }

    private void validateCategory(Category category) {
        if (category == null
                || category.getName() == null
                || category.getName().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên danh mục không được để trống");
        }

        if (category.getName().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên danh mục không được vượt quá 100 ký tự");
        }

        category.setName(category.getName().trim());
    }
}
