package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderCreateRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.PurchaseOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.service.PurchaseOrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService service;

    public PurchaseOrderController(PurchaseOrderService service) {
        this.service = service;
    }

    @GetMapping
    public List<PurchaseOrderResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PurchaseOrderResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public PurchaseOrderResponse create(@RequestBody PurchaseOrderCreateRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/receive")
    public PurchaseOrderResponse receive(@PathVariable Long id) {
        return service.receive(id);
    }

    @PostMapping("/{id}/cancel")
    public PurchaseOrderResponse cancel(@PathVariable Long id) {
        return service.cancel(id);
    }
}