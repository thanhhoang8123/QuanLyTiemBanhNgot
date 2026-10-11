package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.OrderStatusHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface OrderStatusHistoryRepository extends MongoRepository<OrderStatusHistory, String> {

    @Query("{ 'orderId': ?0 }")
    List<OrderStatusHistory> findByOrderId(Long orderId);

    List<OrderStatusHistory> findByOrderIdOrderByChangedAtDesc(Long orderId);
}