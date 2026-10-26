package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.document.ActivityLog;
import com.nhom4.QuanLyTiemBanhNgot.repository.ActivityLogRepository;
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

@Service
public class ActivityLogService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActivityLogService.class);

    private final ActivityLogRepository repository;
    private final MongoAfterCommitWriter afterCommitWriter;

    public ActivityLogService(
            ActivityLogRepository repository,
            MongoAfterCommitWriter afterCommitWriter) {
        this.repository = repository;
        this.afterCommitWriter = afterCommitWriter;
    }

    public List<ActivityLog> findRecent(int limit) {
        try {
            return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
        } catch (RuntimeException exception) {
            LOGGER.warn("Unable to read activity logs from MongoDB; returning an empty result set.", exception);
            return List.of();
        }
    }

    public void recordPurchaseOrderStatusAfterCommit(
            Long purchaseOrderId,
            String oldStatus,
            String newStatus,
            String note) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)
                ? authentication.getName()
                : null;
        ActivityLog activityLog = new ActivityLog(
                null,
                username,
                "PURCHASE_ORDER_STATUS_CHANGED",
                "PURCHASE_ORDER",
                String.valueOf(purchaseOrderId),
                "Trạng thái phiếu nhập thay đổi từ "
                        + (oldStatus == null ? "NONE" : oldStatus)
                        + " sang " + newStatus + ": " + note,
                LocalDateTime.now(ZoneOffset.UTC)
        );
        afterCommitWriter.execute(
                "activity_logs purchaseOrderId=" + purchaseOrderId,
                () -> repository.save(activityLog)
        );
    }
}
