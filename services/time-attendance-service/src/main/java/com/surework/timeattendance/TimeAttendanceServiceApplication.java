package com.surework.timeattendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Time and Attendance Service Application.
 * Handles time tracking, attendance management, and overtime calculations
 * in compliance with South African BCEA regulations.
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.timeattendance",
        "com.surework.common"
})
@EnableJpaAuditing
@EnableScheduling
public class TimeAttendanceServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimeAttendanceServiceApplication.class, args);
    }
}
