package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.document.OrderStatusHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface OrderStatusHistoryRepository extends MongoRepository<OrderStatusHistory, String> {

    List<OrderStatusHistory> findByOrderIdAndNewStatusIsNotNullOrderByCreatedAtDesc(Long orderId);
}