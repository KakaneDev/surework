package com.surework.timeattendance.domain;

import com.surework.common.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * Represents a South African public holiday.
 * Per the Public Holidays Act 36 of 1994.
 */
@Entity
@Table(name = "public_holidays", indexes = {
        @Index(name = "idx_public_holidays_date", columnList = "holiday_date"),
        @Index(name = "idx_public_holidays_year", columnList = "year")
})
@Getter
@Setter
@NoArgsConstructor
public class PublicHoliday extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    @Column(name = "year", nullable = false)
    private int year;

    @Enumerated(EnumType.STRING)
    @Column(name = "holiday_type", nullable = false)
    private HolidayType holidayType;

    @Column(name = "description")
    private String description;

    @Column(name = "is_substitute")
    private boolean substitute = false; // If it falls on Sunday, observed on Monday

    @Column(name = "original_date")
    private LocalDate originalDate;

    @Column(name = "is_active")
    private boolean active = true;

    /**
     * Types of public holidays.
     */
    public enum HolidayType {
        FIXED,          // Fixed date every year
        CALCULATED,     // Date varies (e.g., Good Friday)
        SPECIAL         // One-time special holiday (e.g., election day)
    }

    /**
     * Create a public holiday.
     */
    public static PublicHoliday create(String name, LocalDate date, HolidayType type) {
        PublicHoliday holiday = new PublicHoliday();
        holiday.setName(name);
        holiday.setHolidayDate(adjustForSunday(date));
        holiday.setYear(date.getYear());
        holiday.setHolidayType(type);

        // If the holiday falls on Sunday, it's observed on Monday
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            holiday.setSubstitute(true);
            holiday.setOriginalDate(date);
        }

        return holiday;
    }

    /**
     * Adjust date if it falls on a Sunday (observed on Monday per Public Holidays Act).
     */
    private static LocalDate adjustForSunday(LocalDate date) {
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return date.plusDays(1);
        }
        return date;
    }

    /**
     * Generate South African public holidays for a given year.
     * Per the Public Holidays Act 36 of 1994.
     */
    public static java.util.List<PublicHoliday> generateForYear(int year) {
        java.util.List<PublicHoliday> holidays = new java.util.ArrayList<>();

        // New Year's Day - 1 January
        holidays.add(create("New Year's Day", LocalDate.of(year, 1, 1), HolidayType.FIXED));

        // Human Rights Day - 21 March
        holidays.add(create("Human Rights Day", LocalDate.of(year, 3, 21), HolidayType.FIXED));

        // Good Friday - Friday before Easter Sunday (calculated)
        LocalDate easter = calculateEasterSunday(year);
        holidays.add(create("Good Friday", easter.minusDays(2), HolidayType.CALCULATED));

        // Family Day - Monday after Easter
        holidays.add(create("Family Day", easter.plusDays(1), HolidayType.CALCULATED));

        // Freedom Day - 27 April
        holidays.add(create("Freedom Day", LocalDate.of(year, 4, 27), HolidayType.FIXED));

        // Workers' Day - 1 May
        holidays.add(create("Workers' Day", LocalDate.of(year, 5, 1), HolidayType.FIXED));

        // Youth Day - 16 June
        holidays.add(create("Youth Day", LocalDate.of(year, 6, 16), HolidayType.FIXED));

        // National Women's Day - 9 August
        holidays.add(create("National Women's Day", LocalDate.of(year, 8, 9), HolidayType.FIXED));

        // Heritage Day - 24 September
        holidays.add(create("Heritage Day", LocalDate.of(year, 9, 24), HolidayType.FIXED));

        // Day of Reconciliation - 16 December
        holidays.add(create("Day of Reconciliation", LocalDate.of(year, 12, 16), HolidayType.FIXED));

        // Christmas Day - 25 December
        holidays.add(create("Christmas Day", LocalDate.of(year, 12, 25), HolidayType.FIXED));

        // Day of Goodwill - 26 December
        holidays.add(create("Day of Goodwill", LocalDate.of(year, 12, 26), HolidayType.FIXED));

        return holidays;
    }

    /**
     * Calculate Easter Sunday using the Anonymous Gregorian algorithm.
     */
    private static LocalDate calculateEasterSunday(int year) {
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
     * Check if a date is a public holiday.
     */
    public boolean isOnDate(LocalDate date) {
        return holidayDate.equals(date);
    }
}
