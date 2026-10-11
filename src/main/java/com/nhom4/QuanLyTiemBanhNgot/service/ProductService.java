
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Category;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.repository.CategoryRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.nhom4.QuanLyTiemBanhNgot.exception.DuplicateResourceException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Optional<Product> getById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getAll();
        }

        String value = keyword.trim();

        return productRepository
                .findByNameContainingIgnoreCaseOrProductCodeContainingIgnoreCase(
                        value, value
                );
    }

    @Transactional
    public Product create(Product product) {
        validateProduct(product);

        if (productRepository.existsByProductCode(
                product.getProductCode().trim())) {
            throw new DuplicateResourceException(
                    "Mã sản phẩm đã tồn tại"
            );
        }

        product.setId(null);
        product.setProductCode(product.getProductCode().trim());
        product.setName(product.getName().trim());
        product.setCategory(findCategory(product));
        product.setCreatedAt(java.time.LocalDateTime.now());

        return productRepository.save(product);
    }

    @Transactional
    public Product update(Long id, Product product) {
        Product existing = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                    "Không tìm thấy sản phẩm"
            ));

        validateProduct(product);

        String code = product.getProductCode().trim();

        if (productRepository.existsByProductCodeAndIdNot(code, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã sản phẩm đã được sử dụng"
            );
        }

        existing.setCategory(findCategory(product));
        existing.setProductCode(code);
        existing.setName(product.getName().trim());
        existing.setDescription(product.getDescription());
        existing.setImageUrl(product.getImageUrl());
        existing.setPrice(product.getPrice());
        existing.setQuantity(product.getQuantity());
        existing.setUnit(product.getUnit());
        existing.setExpiryDate(product.getExpiryDate());
        existing.setStatus(product.getStatus());

        // Giữ nguyên id và createdAt của sản phẩm cũ.
        return productRepository.save(existing);
    }

    @Transactional
    public Product deactivate(Long id) {
        Product product = productRepository.findById(id)
.orElseThrow(() -> new ResourceNotFoundException(
        "Không tìm thấy sản phẩm"
));

        product.setStatus(false);
        return productRepository.save(product);
    }

    private void validateProduct(Product product) {
        if (product == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu sản phẩm không được để trống"
            );
        }

        if (product.getProductCode() == null
                || product.getProductCode().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã sản phẩm không được để trống"
            );
        }

        if (product.getName() == null || product.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên sản phẩm không được để trống"
            );
        }

        if (product.getPrice() == null
                || product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá sản phẩm phải lớn hơn hoặc bằng 0"
            );
        }

        if (product.getQuantity() == null || product.getQuantity() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng phải lớn hơn hoặc bằng 0"
            );
        }

        if (product.getStatus() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái sản phẩm không được để trống"
            );
        }
    }

    private Category findCategory(Product product) {
        if (product.getCategory() == null
                || product.getCategory().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn danh mục sản phẩm"
            );
        }

        return categoryRepository.findById(product.getCategory().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Danh mục sản phẩm không tồn tại"
                ));
    }
}
