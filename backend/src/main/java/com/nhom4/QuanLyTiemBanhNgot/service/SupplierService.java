
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.Supplier;
import com.nhom4.QuanLyTiemBanhNgot.repository.PurchaseOrderRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.SupplierRepository;
import com.nhom4.QuanLyTiemBanhNgot.validation.TV2ValidationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository repository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public SupplierService(
            SupplierRepository repository,
            PurchaseOrderRepository purchaseOrderRepository) {
        this.repository = repository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    public List<Supplier> findAll() {
        return repository.findAll();
    }

    public Supplier findById(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "ID nhà cung cấp không hợp lệ");
        }

        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy nhà cung cấp"));
    }

    @Transactional
    public Supplier save(Supplier supplier) {
        TV2ValidationUtils.validateSupplier(supplier);

        if (supplier.getId() != null) {
            repository.findByIdForUpdate(supplier.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Không tìm thấy nhà cung cấp"));
        }

        supplier.setSupplierCode(supplier.getSupplierCode().trim());
        supplier.setName(supplier.getName().trim());

        if (supplier.getPhone() != null) {
            supplier.setPhone(supplier.getPhone().trim());
        }

        if (supplier.getEmail() != null) {
            supplier.setEmail(supplier.getEmail().trim());
        }

        if (supplier.getAddress() != null) {
            supplier.setAddress(supplier.getAddress().trim());
        }

        TV2ValidationUtils.validateSupplierDuplicate(
                supplier, repository.findAll());

        if (supplier.getStatus() == null) {
            supplier.setStatus(true);
        }

        return repository.save(supplier);
    }

    @Transactional
    public void deleteById(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "ID nhà cung cấp không hợp lệ");
        }
        Supplier supplier = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy nhà cung cấp"));
        if (purchaseOrderRepository.existsBySupplier_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa nhà cung cấp đã có phiếu nhập tham chiếu; hãy ngừng hoạt động thay thế");
        }
        repository.delete(supplier);
    }
}
