package com.surework.hr.service;

import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.util.HashSet;
import java.util.Set;

/**
 * Service for managing South African public holidays.
 * Implements BCEA compliance for working day calculations.
 *
 * South African Public Holidays:
 * - 1 January: New Year's Day
 * - 21 March: Human Rights Day
 * - Good Friday (movable)
 * - Family Day (Monday after Easter)
 * - 27 April: Freedom Day
 * - 1 May: Workers' Day
 * - 16 June: Youth Day
 * - 9 August: National Women's Day
 * - 24 September: Heritage Day
 * - 16 December: Day of Reconciliation
 * - 25 December: Christmas Day
 * - 26 December: Day of Goodwill
 *
 * When a public holiday falls on a Sunday, the Monday following is a public holiday.
 */
@Service
public class PublicHolidayService {

    /**
     * Get all public holidays for a specific year.
     */
    public Set<LocalDate> getPublicHolidays(int year) {
        Set<LocalDate> holidays = new HashSet<>();

        // Fixed date holidays
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.JANUARY, 1));   // New Year's Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.MARCH, 21));    // Human Rights Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.APRIL, 27));    // Freedom Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.MAY, 1));       // Workers' Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.JUNE, 16));     // Youth Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.AUGUST, 9));    // National Women's Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.SEPTEMBER, 24));// Heritage Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.DECEMBER, 16)); // Day of Reconciliation
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.DECEMBER, 25)); // Christmas Day
        addHolidayWithSundayRule(holidays, LocalDate.of(year, Month.DECEMBER, 26)); // Day of Goodwill

        // Easter-based movable holidays
        LocalDate easter = calculateEasterSunday(year);
        holidays.add(easter.minusDays(2));  // Good Friday
        holidays.add(easter.plusDays(1));   // Family Day (Easter Monday)

        return holidays;
    }

    /**
     * Check if a date is a public holiday.
     */
    public boolean isPublicHoliday(LocalDate date) {
        return getPublicHolidays(date.getYear()).contains(date);
    }

    /**
     * Calculate working days between two dates, excluding weekends and public holidays.
     */
    public int calculateWorkingDays(LocalDate start, LocalDate end) {
        if (start.isAfter(end)) {
            return 0;
        }

        // Get all holidays that might be in the range
        Set<LocalDate> holidays = new HashSet<>();
        for (int year = start.getYear(); year <= end.getYear(); year++) {
            holidays.addAll(getPublicHolidays(year));
        }

        int workingDays = 0;
        LocalDate current = start;

        while (!current.isAfter(end)) {
            DayOfWeek dayOfWeek = current.getDayOfWeek();
            boolean isWeekend = dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
            boolean isHoliday = holidays.contains(current);

            if (!isWeekend && !isHoliday) {
                workingDays++;
            }

            current = current.plusDays(1);
        }

        return workingDays;
    }

    /**
     * Add holiday to set, applying the Sunday rule.
     * If a holiday falls on Sunday, the following Monday is also a public holiday.
     */
    private void addHolidayWithSundayRule(Set<LocalDate> holidays, LocalDate holiday) {
        holidays.add(holiday);
        if (holiday.getDayOfWeek() == DayOfWeek.SUNDAY) {
            holidays.add(holiday.plusDays(1)); // Monday becomes public holiday
        }
    }

    /**
     * Calculate Easter Sunday using the Anonymous Gregorian algorithm.
     * This is the algorithm adopted by the Vatican for the Gregorian calendar.
     */
    private LocalDate calculateEasterSunday(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = ((h + l - 7 * m + 114) % 31) + 1;

        return LocalDate.of(year, month, day);
    }

    /**
     * Get the next working day after a given date.
     */
    public LocalDate getNextWorkingDay(LocalDate date) {
        LocalDate next = date.plusDays(1);
        while (isWeekendOrHoliday(next)) {
            next = next.plusDays(1);
        }
        return next;
    }

    /**
     * Check if a date is a weekend or public holiday.
     */
    public boolean isWeekendOrHoliday(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        return dayOfWeek == DayOfWeek.SATURDAY ||
               dayOfWeek == DayOfWeek.SUNDAY ||
               isPublicHoliday(date);
    }

    /**
     * Check if a date is a working day.
     */
    public boolean isWorkingDay(LocalDate date) {
        return !isWeekendOrHoliday(date);
    }
}
