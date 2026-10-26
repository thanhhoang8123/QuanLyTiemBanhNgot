package com.nhom4.QuanLyTiemBanhNgot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class MongoAfterCommitWriter {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoAfterCommitWriter.class);

    private final TaskExecutor mongoAuditTaskExecutor;

    public MongoAfterCommitWriter(TaskExecutor mongoAuditTaskExecutor) {
        this.mongoAuditTaskExecutor = mongoAuditTaskExecutor;
    }

    public void execute(String operation, Runnable write) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException(
                    "MongoDB audit writes must be scheduled inside a MySQL transaction");
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    mongoAuditTaskExecutor.execute(() -> {
                        try {
                            write.run();
                        } catch (DataAccessException exception) {
                            LOGGER.error(
                                    "MongoDB write failed after MySQL commit: {}",
                                    operation,
                                    exception);
                        }
                    });
                } catch (TaskRejectedException exception) {
                    LOGGER.error(
                            "MongoDB write could not be queued after MySQL commit: {}",
                            operation,
                            exception);
                }
            }
        });
    }
}
