
package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Kiểm tra mã sản phẩm đã tồn tại
    boolean existsByProductCode(String productCode);

    // Kiểm tra mã sản phẩm có thuộc sản phẩm khác khi cập nhật
    boolean existsByProductCodeAndIdNot(String productCode, Long id);

    // Tìm sản phẩm theo tên hoặc mã sản phẩm
    List<Product> findByNameContainingIgnoreCaseOrProductCodeContainingIgnoreCase(
            String name, String productCode);

    // Kiểm tra danh mục đang được sản phẩm sử dụng
    boolean existsByCategory_Id(Long categoryId);
}
