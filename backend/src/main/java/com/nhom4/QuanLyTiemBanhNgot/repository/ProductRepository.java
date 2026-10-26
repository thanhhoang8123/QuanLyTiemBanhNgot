
package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query(value = "SELECT * FROM products WHERE id IN (:ids) ORDER BY id FOR UPDATE", nativeQuery = true)
    List<Product> findAllByIdForUpdate(@Param("ids") List<Long> ids);

    @Query(value = "SELECT * FROM products WHERE id = :id FOR UPDATE", nativeQuery = true)
    java.util.Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
