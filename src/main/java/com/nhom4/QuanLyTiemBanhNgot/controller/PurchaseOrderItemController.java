package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.PurchaseOrderItem;
import com.nhom4.QuanLyTiemBanhNgot.service.PurchaseOrderItemService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-order-items")
public class PurchaseOrderItemController {

    private final PurchaseOrderItemService service;

    public PurchaseOrderItemController(PurchaseOrderItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<PurchaseOrderItem> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PurchaseOrderItem findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public PurchaseOrderItem create(@RequestBody PurchaseOrderItem item) {
        return service.save(item);
    }

    @PutMapping("/{id}")
    public PurchaseOrderItem update(@PathVariable Long id, @RequestBody PurchaseOrderItem item) {
        item.setId(id);
        return service.save(item);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}