package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.PurchaseOrderItem;
import com.nhom4.QuanLyTiemBanhNgot.repository.PurchaseOrderItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseOrderItemService {

    private final PurchaseOrderItemRepository repository;

    public PurchaseOrderItemService(PurchaseOrderItemRepository repository) {
        this.repository = repository;
    }

    public List<PurchaseOrderItem> findAll() {
        return repository.findAll();
    }

    public PurchaseOrderItem findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public PurchaseOrderItem save(PurchaseOrderItem item) {
        return repository.save(item);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}