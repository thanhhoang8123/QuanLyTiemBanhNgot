package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.PurchaseOrder;
import com.nhom4.QuanLyTiemBanhNgot.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository repository;

    public PurchaseOrderService(PurchaseOrderRepository repository) {
        this.repository = repository;
    }

    public List<PurchaseOrder> findAll() {
        return repository.findAll();
    }

    public PurchaseOrder findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public PurchaseOrder save(PurchaseOrder purchaseOrder) {
        return repository.save(purchaseOrder);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}