package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.entity.OrderStatusHistory;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderStatusHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderStatusHistoryService {

    private final OrderStatusHistoryRepository repository;

    public OrderStatusHistoryService(OrderStatusHistoryRepository repository) {
        this.repository = repository;
    }

    public OrderStatusHistory recordStatusChange(
            Long orderId,
            String fromStatus,
            String toStatus,
            Long changedBy,
            String note) {

        OrderStatusHistory history = new OrderStatusHistory(
                orderId,
                fromStatus,
                toStatus,
                changedBy,
                LocalDateTime.now(),
                note
        );

        return repository.save(history);
    }

    public List<OrderStatusHistory> findByOrderId(Long orderId) {
        return repository.findByOrderIdOrderByChangedAtDesc(orderId);
    }
}