package com.surework.recruitment.service;

import com.surework.recruitment.domain.Application;
import com.surework.recruitment.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job that auto-expires offers past their expiry date.
 * Runs daily at 6 AM SAST.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class OfferExpiryScheduler {

    private final ApplicationRepository applicationRepository;

    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    public void expireOffers() {
        List<Application> expiredOffers = applicationRepository.findExpiredOffers(LocalDate.now());

        if (expiredOffers.isEmpty()) {
            log.debug("No expired offers found");
            return;
        }

        log.info("Found {} expired offers to auto-decline", expiredOffers.size());

        for (Application application : expiredOffers) {
            try {
                application.declineOffer("Offer expired");
                applicationRepository.save(application);
                log.info("Auto-expired offer for application {}", application.getApplicationReference());
            } catch (Exception e) {
                log.error("Failed to expire offer for application {}: {}",
                        application.getApplicationReference(), e.getMessage(), e);
            }
        }
    }
}
