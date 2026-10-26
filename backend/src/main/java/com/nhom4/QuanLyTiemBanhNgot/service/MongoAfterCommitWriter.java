package com.nhom4.QuanLyTiemBanhNgot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class MongoAfterCommitWriter {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoAfterCommitWriter.class);

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
                    write.run();
                } catch (DataAccessException exception) {
                    LOGGER.error("MongoDB write failed after MySQL commit: {}", operation, exception);
                }
            }
        });
    }
}
