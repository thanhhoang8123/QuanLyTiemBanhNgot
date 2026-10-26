package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.document.OrderStatusHistory;
import com.nhom4.QuanLyTiemBanhNgot.repository.OrderStatusHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
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

    private static final Logger LOGGER = LoggerFactory.getLogger(OrderStatusHistoryService.class);

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
        try {
            return repository.findByOrderIdAndNewStatusIsNotNullOrderByCreatedAtDesc(orderId);
        } catch (RuntimeException exception) {
            LOGGER.warn("Unable to read order status history from MongoDB; returning an empty result set.", exception);
            return List.of();
        }
    }

    public List<OrderStatusHistory> findRecent(int limit) {
        try {
            return repository.findAllByNewStatusIsNotNullOrderByCreatedAtDesc(PageRequest.of(0, limit));
        } catch (RuntimeException exception) {
            LOGGER.warn("Unable to read recent order status history from MongoDB; returning an empty result set.", exception);
            return List.of();
        }
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