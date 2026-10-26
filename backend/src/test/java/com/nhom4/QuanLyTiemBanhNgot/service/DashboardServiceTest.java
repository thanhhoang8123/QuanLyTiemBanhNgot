package com.nhom4.QuanLyTiemBanhNgot.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DashboardServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 26);

    @Test
    void todayRangeIncludesOnlyToday() {
        DashboardService.DateRange range = DashboardService.DateRange.forPeriod("today", TODAY);

        assertEquals(TODAY, range.start());
        assertEquals(TODAY.plusDays(1), range.endExclusive());
    }

    @Test
    void weekRangeIncludesTodayAndPreviousSixDays() {
        DashboardService.DateRange range = DashboardService.DateRange.forPeriod("week", TODAY);

        assertEquals(TODAY.minusDays(6), range.start());
        assertEquals(TODAY.plusDays(1), range.endExclusive());
    }

    @Test
    void monthRangeUsesCalendarMonthBoundaries() {
        DashboardService.DateRange range = DashboardService.DateRange.forPeriod("month", TODAY);

        assertEquals(LocalDate.of(2026, 10, 1), range.start());
        assertEquals(LocalDate.of(2026, 11, 1), range.endExclusive());
    }

    @Test
    void unknownPeriodIsRejected() {
        assertThrows(
                IllegalArgumentException.class,
                () -> DashboardService.DateRange.forPeriod("year", TODAY)
        );
    }
}
