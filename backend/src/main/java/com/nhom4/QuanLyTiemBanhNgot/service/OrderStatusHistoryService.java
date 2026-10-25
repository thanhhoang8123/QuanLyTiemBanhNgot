package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.document.OrderStatusHistory;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderStatusHistoryRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;

@Service
public class OrderStatusHistoryService {

    private final OrderStatusHistoryRepository repository;
    private final MongoAfterCommitWriter afterCommitWriter;

    public OrderStatusHistoryService(
            OrderStatusHistoryRepository repository,
            MongoAfterCommitWriter afterCommitWriter) {
        this.repository = repository;
        this.afterCommitWriter = afterCommitWriter;
    }

    public void recordStatusChangeAfterCommit(
            Long orderId,
            String oldStatus,
            String newStatus,
            String note) {
        if (Objects.equals(oldStatus, newStatus)) {
            return;
        }

        String changedBy = currentUsername();
        OrderStatusHistory history = new OrderStatusHistory(
                orderId,
                oldStatus,
                newStatus,
                changedBy,
                LocalDateTime.now(ZoneOffset.UTC),
                note
        );
        afterCommitWriter.execute(
                "order_status_histories orderId=" + orderId,
                () -> repository.save(history)
        );
    }

    public List<OrderStatusHistory> findByOrderId(Long orderId) {
        return repository.findByOrderIdAndNewStatusIsNotNullOrderByCreatedAtDesc(orderId);
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return authentication.getName();
    }
}