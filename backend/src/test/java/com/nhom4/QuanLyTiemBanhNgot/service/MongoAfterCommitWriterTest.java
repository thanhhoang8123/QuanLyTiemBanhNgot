package com.nhom4.QuanLyTiemBanhNgot.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.task.TaskExecutor;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MongoAfterCommitWriterTest {

    @AfterEach
    void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void schedulesMongoWriteAfterCommitWithoutBlockingCommitThread() {
        List<Runnable> queuedTasks = new ArrayList<>();
        TaskExecutor executor = queuedTasks::add;
        MongoAfterCommitWriter writer = new MongoAfterCommitWriter(executor);
        AtomicBoolean writeRan = new AtomicBoolean();

        TransactionSynchronizationManager.setActualTransactionActive(true);
        TransactionSynchronizationManager.initSynchronization();
        writer.execute("order status", () -> writeRan.set(true));

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(synchronization -> synchronization.afterCommit());

        assertFalse(writeRan.get());
        assertEquals(1, queuedTasks.size());
        queuedTasks.get(0).run();
        assertTrue(writeRan.get());
    }
}
