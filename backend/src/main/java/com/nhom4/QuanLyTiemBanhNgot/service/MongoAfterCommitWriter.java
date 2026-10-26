package com.nhom4.QuanLyTiemBanhNgot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class MongoAfterCommitWriter {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoAfterCommitWriter.class);

    public void execute(String operation, Runnable write) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            LOGGER.warn(
                    "MongoDB audit write for {} executed outside a DB transaction; persisting synchronously instead.",
                    operation
            );
            try {
                write.run();
            } catch (RuntimeException exception) {
                LOGGER.error("MongoDB write failed for operation: {}", operation, exception);
            }
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    write.run();
                } catch (RuntimeException exception) {
                    LOGGER.error("MongoDB write failed after MySQL commit: {}", operation, exception);
                }
            }
        });
    }
}
