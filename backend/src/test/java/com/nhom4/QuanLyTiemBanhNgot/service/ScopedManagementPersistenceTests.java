package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Category;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.entity.Ingredient;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.repository.CategoryRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.IngredientRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderCreateRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Supplier;
import com.nhom4.QuanLyTiemBanhNgot.repository.PurchaseOrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class ScopedManagementPersistenceTests {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private IngredientService ingredientService;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Test
    void productUpdatePersistsImageDescriptionAndExpiryDate() {
        Category category = categoryRepository.findAll().stream()
                .findFirst()
                .orElseThrow();
        Product product = new Product();
        product.setCategory(category);
        product.setProductCode("TST-" + UUID.randomUUID().toString().substring(0, 12));
        product.setName("Test product");
        product.setPrice(new BigDecimal("125000.50"));
        product.setQuantity(4);
        product.setStatus(true);
        productService.create(product);

        String imageUrl = "https://res.cloudinary.com/test-cloud/image/upload/v1/products/test-image.webp";
        LocalDate expiryDate = LocalDate.now().plusDays(30);
        Product update = new Product();
        update.setCategory(category);
        update.setProductCode(product.getProductCode());
        update.setName("Updated test product");
        update.setDescription("Updated description");
        update.setImageUrl(imageUrl);
        update.setPrice(new BigDecimal("130000.25"));
        update.setQuantity(7);
        update.setUnit("hộp");
        update.setExpiryDate(expiryDate);
        update.setStatus(false);

        Product updated = productService.update(product.getId(), update, 4);
        productRepository.flush();

        Product persisted = productRepository.findById(updated.getId()).orElseThrow();
        assertEquals("Updated test product", persisted.getName());
        assertEquals("Updated description", persisted.getDescription());
        assertEquals(imageUrl, persisted.getImageUrl());
        assertEquals(0, new BigDecimal("130000.25").compareTo(persisted.getPrice()));
        assertEquals(7, persisted.getQuantity());
        assertEquals("hộp", persisted.getUnit());
        assertEquals(expiryDate, persisted.getExpiryDate());
        assertEquals(false, persisted.getStatus());
        assertEquals(1, productRepository.findAllByIdForUpdate(
                java.util.List.of(updated.getId())).size());
    }

    @Test
    void productUpdateRejectsStaleStockWithoutChangingProduct() {
        Category category = categoryRepository.findAll().stream()
                .findFirst()
                .orElseThrow();
        Product product = new Product();
        product.setCategory(category);
        product.setProductCode("TST-" + UUID.randomUUID().toString().substring(0, 12));
        product.setName("Fresh product");
        product.setPrice(new BigDecimal("125000.50"));
        product.setQuantity(4);
        product.setStatus(true);
        Product created = productService.create(product);

        Product update = new Product();
        update.setCategory(category);
        update.setProductCode(created.getProductCode());
        update.setName("Should not overwrite");
        update.setPrice(new BigDecimal("130000.25"));
        update.setQuantity(7);
        update.setStatus(true);

        assertThrows(
                ConflictException.class,
                () -> productService.update(created.getId(), update, 3)
        );
        Product persisted = productRepository.findById(created.getId()).orElseThrow();
        assertEquals("Fresh product", persisted.getName());
        assertEquals(4, persisted.getQuantity());
    }

    @Test
    void deletingUnreferencedProductRemovesItFromDatabase() {
        Category category = categoryRepository.findAll().stream()
                .findFirst()
                .orElseThrow();
        Product product = new Product();
        product.setCategory(category);
        product.setProductCode("TST-" + UUID.randomUUID().toString().substring(0, 12));
        product.setName("Deletable test product");
        product.setPrice(BigDecimal.ZERO);
        product.setQuantity(0);
        product.setStatus(false);
        Product created = productService.create(product);

        productService.delete(created.getId());
        productRepository.flush();

        assertEquals(false, productRepository.existsById(created.getId()));
    }

    @Test
    void deactivatingProductPersistsHiddenStatusWithoutDeletingIt() {
        Category category = categoryRepository.findAll().stream()
                .findFirst()
                .orElseThrow();
        Product product = new Product();
        product.setCategory(category);
        product.setProductCode("TST-" + UUID.randomUUID().toString().substring(0, 12));
        product.setName("Deactivated test product");
        product.setPrice(BigDecimal.ZERO);
        product.setQuantity(1);
        product.setStatus(true);
        Product created = productService.create(product);

        productService.deactivate(created.getId());
        productRepository.flush();

        Product persisted = productRepository.findById(created.getId()).orElseThrow();
        assertEquals(false, persisted.getStatus());
        assertEquals(created.getId(), persisted.getId());
    }

    @Test
    void ingredientUpdatePreservesServerStockAndRejectsUnsafeUnitChange() {
        String suffix = UUID.randomUUID().toString().substring(0, 10);
        Ingredient ingredient = new Ingredient();
        ingredient.setIngredientCode("TST-" + suffix);
        ingredient.setName("Test ingredient " + suffix);
        ingredient.setUnit("kg");
        ingredient.setStockQuantity(new BigDecimal("4.250"));
        ingredient.setMinStockLevel(new BigDecimal("1.000"));
        ingredient.setUnitPrice(new BigDecimal("12.50"));
        ingredient.setStatus(true);
        Ingredient created = ingredientService.save(ingredient);

        Ingredient update = new Ingredient();
        update.setId(created.getId());
        update.setIngredientCode(created.getIngredientCode());
        update.setName("Updated " + created.getName());
        update.setUnit("g");
        update.setStockQuantity(BigDecimal.ZERO);
        update.setMinStockLevel(new BigDecimal("2.000"));
        update.setUnitPrice(new BigDecimal("15.00"));
        update.setStatus(true);

        assertThrows(ResponseStatusException.class,
                () -> ingredientService.save(update));

        update.setUnit("kg");
        update.setStockQuantity(new BigDecimal("999.000"));
        ingredientService.save(update);
        ingredientRepository.flush();

        Ingredient persisted = ingredientRepository.findById(created.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("4.250").compareTo(persisted.getStockQuantity()));
        assertEquals("kg", persisted.getUnit());
    }

    @Test
    void receivingPurchaseOrderUpdatesStockOnceAndProtectsReferences() {
        String suffix = UUID.randomUUID().toString().substring(0, 10);
        Employee employee = employeeRepository.findAll().stream()
                .filter(candidate -> Boolean.TRUE.equals(candidate.getStatus()))
                .findFirst()
                .orElseThrow();

        Supplier supplier = new Supplier();
        supplier.setSupplierCode("TST-" + suffix);
        supplier.setName("Test supplier " + suffix);
        supplier.setStatus(true);
        supplier = supplierService.save(supplier);
        Long supplierId = supplier.getId();

        Ingredient ingredient = new Ingredient();
        ingredient.setIngredientCode("TST-" + suffix);
        ingredient.setName("Test ingredient " + suffix);
        ingredient.setUnit("kg");
        ingredient.setStockQuantity(new BigDecimal("1.000"));
        ingredient.setMinStockLevel(BigDecimal.ZERO);
        ingredient.setUnitPrice(new BigDecimal("12.75"));
        ingredient.setStatus(true);
        ingredient = ingredientService.save(ingredient);
        Long ingredientId = ingredient.getId();

        PurchaseOrderResponse created = purchaseOrderService.create(
                new PurchaseOrderCreateRequest(
                        supplier.getId(),
                        employee.getId(),
                        java.util.List.of(
                                new PurchaseOrderCreateRequest.PurchaseOrderItemRequest(
                                        ingredient.getId(),
                                        new BigDecimal("2.500"),
                                        new BigDecimal("12.75")))));
        assertEquals(0, new BigDecimal("31.88").compareTo(created.totalAmount()));

        PurchaseOrderResponse received =
                purchaseOrderService.receive(created.id());
        ingredientRepository.flush();
        assertEquals("RECEIVED", received.status());
        assertEquals(0, new BigDecimal("3.500").compareTo(
                ingredientRepository.findById(ingredient.getId())
                        .orElseThrow()
                        .getStockQuantity()));

        assertThrows(ResponseStatusException.class,
                () -> purchaseOrderService.receive(created.id()));
        assertThrows(ResponseStatusException.class,
                () -> ingredientService.deleteById(ingredientId));
        assertThrows(ResponseStatusException.class,
                () -> supplierService.deleteById(supplierId));

        assertEquals("RECEIVED", purchaseOrderRepository.findById(created.id())
                .orElseThrow().getStatus());
        assertEquals(0, new BigDecimal("3.500").compareTo(
                ingredientRepository.findById(ingredientId)
                        .orElseThrow()
                        .getStockQuantity()));
    }
}
