package com.nhom4.QuanLyTiemBanhNgot.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ingredients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ingredient_code", length = 30)
    private String ingredientCode;

    @Column(name = "name", length = 150)
    private String name;

    @Column(name = "unit", length = 30)
    private String unit;

    @Column(name = "stock_quantity", precision = 15, scale = 3)
    private BigDecimal stockQuantity;

    @Column(name = "min_stock_level", precision = 15, scale = 3)
    private BigDecimal minStockLevel;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "status")
    private Boolean status;
}