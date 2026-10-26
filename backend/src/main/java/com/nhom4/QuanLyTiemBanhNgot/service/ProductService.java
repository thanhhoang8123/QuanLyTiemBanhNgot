
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Category;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.repository.CategoryRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderItemRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
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
    private final OrderItemRepository orderItemRepository;
    private final PromotionProductRepository promotionProductRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            OrderItemRepository orderItemRepository,
            PromotionProductRepository promotionProductRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.promotionProductRepository = promotionProductRepository;
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
    public Product update(Long id, Product product, Integer expectedQuantity) {
        Product existing = productRepository.findByIdForUpdate(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                    "Không tìm thấy sản phẩm"
            ));

        if (expectedQuantity == null || expectedQuantity < 0) {
            throw new BadRequestException("Số lượng tồn kho đối chiếu không hợp lệ");
        }
        if (!Integer.valueOf(expectedQuantity).equals(existing.getQuantity())) {
            throw new ConflictException(
                    "Tồn kho đã thay đổi trong lúc bạn chỉnh sửa. Hãy tải lại danh sách trước khi lưu."
            );
        }

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
        Product product = productRepository.findByIdForUpdate(id)
.orElseThrow(() -> new ResourceNotFoundException(
        "Không tìm thấy sản phẩm"
));

        product.setStatus(false);
        return productRepository.save(product);
    }

    @Transactional
    public void delete(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "ID sản phẩm không hợp lệ");
        }

        Product product = productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm"));

        if (orderItemRepository.existsByProduct_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa sản phẩm vì sản phẩm đã có trong đơn hàng.");
        }

        promotionProductRepository.deleteAll(
                promotionProductRepository.findByProduct_Id(id));
        productRepository.delete(product);
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

        validateLength(product.getProductCode(), 30, "Mã sản phẩm");
        validateLength(product.getName(), 150, "Tên sản phẩm");
        validateLength(product.getImageUrl(), 500, "URL hình ảnh");
        validateLength(product.getUnit(), 30, "Đơn vị");

        if (product.getPrice() == null
                || product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá sản phẩm phải lớn hơn hoặc bằng 0"
            );
        }
        if (product.getPrice().stripTrailingZeros().scale() > 2
                || product.getPrice().compareTo(
                        new BigDecimal("9999999999999.99")) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá sản phẩm vượt quá giới hạn lưu trữ (tối đa 2 chữ số thập phân)"
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

    private void validateLength(String value, int maxLength, String field) {
        if (value != null && value.trim().length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + " không được vượt quá " + maxLength + " ký tự"
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
