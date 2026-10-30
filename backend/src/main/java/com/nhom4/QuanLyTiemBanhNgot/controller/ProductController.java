package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.dto.PageResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // Lấy danh sách sản phẩm
    @GetMapping
    public List<Product> getAll() {
        return productService.getAll();
    }

    @GetMapping("/page")
    public PageResponse<Product> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean status,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "ASC") String direction) {
        return PageResponse.from(productService.getPage(
                page, size, keyword, categoryId, status, sort, direction));
    }

    // Tìm kiếm theo tên hoặc mã sản phẩm
    @GetMapping("/search")
    public List<Product> search(@RequestParam String keyword) {
        return productService.search(keyword);
    }

    // Danh sách sản phẩm sắp hết hạn (mặc định trong vòng 1 ngày)
    @GetMapping("/expiring")
    public List<Product> getExpiring(
            @RequestParam(defaultValue = "1") int days,
            @RequestParam(required = false) Boolean status) {
        return productService.getExpiringProducts(days, status);
    }

    // Lấy chi tiết sản phẩm
    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return productService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Thêm sản phẩm
    @PostMapping
    public ResponseEntity<Product> create(
            @RequestBody Product product) {

        Product created = productService.create(product);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    // Cập nhật sản phẩm
    @PutMapping("/{id}")
    public ResponseEntity<Product> update(
            @PathVariable Long id,
            @RequestHeader("X-Expected-Quantity") Integer expectedQuantity,
            @RequestBody Product product) {

        return ResponseEntity.ok(
                productService.update(id, product, expectedQuantity)
        );
    }

    // Xóa sản phẩm chưa được tham chiếu từ đơn hàng.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Ngừng kinh doanh sản phẩm nhưng giữ nguyên dữ liệu.
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Product> deactivate(
            @PathVariable Long id) {
        return ResponseEntity.ok(productService.deactivate(id));
    }
}
