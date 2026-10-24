

package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.Supplier;
import com.nhom4.QuanLyTiemBanhNgot.service.SupplierService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class SupplierController {

    private final SupplierService service;

    public SupplierController(SupplierService service) {
        this.service = service;
    }

    @GetMapping
    public List<Supplier> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Supplier findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Supplier create(@RequestBody Supplier supplier) {
        supplier.setId(null);
        return service.save(supplier);
    }

    @PutMapping("/{id}")
    public Supplier update(@PathVariable Long id, @RequestBody Supplier supplier) {
        supplier.setId(id);
        return service.save(supplier);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
