package com.surework.notification.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of RecipientResolver that calls HR service endpoints
 * to resolve employee and manager user IDs.
 *
 * <p>Uses Resilience4j for retry and circuit breaker patterns to handle
 * transient failures when calling external services.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RecipientResolverImpl implements RecipientResolver {

    private static final String HR_SERVICE_CB = "hrService";
    private static final String RECRUITMENT_SERVICE_CB = "recruitmentService";
    private static final String IDENTITY_SERVICE_CB = "identityService";

    private final RestTemplate restTemplate;

    @Value("${surework.services.hr-service.url:http://localhost:8083}")
    private String hrServiceUrl;

    @Value("${surework.services.recruitment-service.url:http://localhost:8088}")
    private String recruitmentServiceUrl;

    @Value("${surework.services.identity-service.url:http://localhost:8081}")
    private String identityServiceUrl;

    @Override
    @Retry(name = HR_SERVICE_CB, fallbackMethod = "getEmployeeUserIdFallback")
    @CircuitBreaker(name = HR_SERVICE_CB, fallbackMethod = "getEmployeeUserIdFallback")
    public Optional<UUID> getEmployeeUserId(UUID employeeId) {
        String url = hrServiceUrl + "/api/v1/employees/" + employeeId + "/user-id";
        log.debug("Resolving employee {} to user ID via {}", employeeId, url);

        ResponseEntity<UserIdResponse> response = restTemplate.getForEntity(url, UserIdResponse.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            UUID userId = response.getBody().userId();
            log.debug("Resolved employee {} to user {}", employeeId, userId);
            return Optional.ofNullable(userId);
        }

        log.warn("HR service returned non-success status for employee {}: {}", employeeId, response.getStatusCode());
        return Optional.empty();
    }

    /**
     * Fallback when HR service is unavailable for employee user ID lookup.
     */
    private Optional<UUID> getEmployeeUserIdFallback(UUID employeeId, Exception e) {
        log.warn("HR service unavailable for employee {} user lookup (circuit breaker/retry exhausted): {}",
                employeeId, e.getMessage());
        return Optional.empty();
    }

    @Override
    @Retry(name = HR_SERVICE_CB, fallbackMethod = "getManagerUserIdFallback")
    @CircuitBreaker(name = HR_SERVICE_CB, fallbackMethod = "getManagerUserIdFallback")
    public Optional<UUID> getManagerUserId(UUID employeeId) {
        String url = hrServiceUrl + "/api/v1/employees/" + employeeId + "/manager-user-id";
        log.debug("Resolving manager for employee {} via {}", employeeId, url);

        ResponseEntity<UserIdResponse> response = restTemplate.getForEntity(url, UserIdResponse.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            UUID userId = response.getBody().userId();
            log.debug("Resolved manager for employee {} to user {}", employeeId, userId);
            return Optional.ofNullable(userId);
        }

        log.warn("HR service returned non-success status for manager lookup: {}", response.getStatusCode());
        return Optional.empty();
    }

    /**
     * Fallback when HR service is unavailable for manager user ID lookup.
     */
    private Optional<UUID> getManagerUserIdFallback(UUID employeeId, Exception e) {
        log.warn("HR service unavailable for manager lookup of employee {} (circuit breaker/retry exhausted): {}",
                employeeId, e.getMessage());
        return Optional.empty();
    }

    @Override
    @Retry(name = RECRUITMENT_SERVICE_CB, fallbackMethod = "getHiringManagerUserIdFallback")
    @CircuitBreaker(name = RECRUITMENT_SERVICE_CB, fallbackMethod = "getHiringManagerUserIdFallback")
    public Optional<UUID> getHiringManagerUserId(UUID jobPostingId) {
        String url = recruitmentServiceUrl + "/api/recruitment/jobs/" + jobPostingId + "/hiring-manager-user-id";
        log.debug("Resolving hiring manager for job {} via {}", jobPostingId, url);

        ResponseEntity<UserIdResponse> response = restTemplate.getForEntity(url, UserIdResponse.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            UUID userId = response.getBody().userId();
            log.debug("Resolved hiring manager for job {} to user {}", jobPostingId, userId);
            return Optional.ofNullable(userId);
        }

        log.warn("Recruitment service returned non-success status for hiring manager lookup: {}", response.getStatusCode());
        return Optional.empty();
    }

    /**
     * Fallback when Recruitment service is unavailable for hiring manager lookup.
     */
    private Optional<UUID> getHiringManagerUserIdFallback(UUID jobPostingId, Exception e) {
        log.warn("Recruitment service unavailable for job {} hiring manager lookup (circuit breaker/retry exhausted): {}",
                jobPostingId, e.getMessage());
        return Optional.empty();
    }

    @Override
    @Retry(name = IDENTITY_SERVICE_CB, fallbackMethod = "getPortalAdminUserIdsFallback")
    @CircuitBreaker(name = IDENTITY_SERVICE_CB, fallbackMethod = "getPortalAdminUserIdsFallback")
    public List<UUID> getPortalAdminUserIds() {
        String url = identityServiceUrl + "/api/v1/users/by-roles?roles=SUPER_ADMIN,PORTAL_ADMIN";
        log.debug("Resolving portal admin user IDs via {}", url);

        try {
            ResponseEntity<List<UUID>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<UUID>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<UUID> userIds = response.getBody();
                log.debug("Resolved {} portal admin users", userIds.size());
                return userIds;
            }

            log.warn("Identity service returned non-success status for portal admin lookup: {}", response.getStatusCode());
            return Collections.emptyList();
        } catch (RestClientException e) {
            log.error("Error calling identity service for portal admin lookup: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Fallback when Identity service is unavailable for portal admin lookup.
     */
    private List<UUID> getPortalAdminUserIdsFallback(Exception e) {
        log.warn("Identity service unavailable for portal admin lookup (circuit breaker/retry exhausted): {}",
                e.getMessage());
        return Collections.emptyList();
    }

    @Override
    @Retry(name = RECRUITMENT_SERVICE_CB, fallbackMethod = "getRecruitmentTeamUserIdsFallback")
    @CircuitBreaker(name = RECRUITMENT_SERVICE_CB, fallbackMethod = "getRecruitmentTeamUserIdsFallback")
    public List<UUID> getRecruitmentTeamUserIds(UUID tenantId) {
        String url = recruitmentServiceUrl + "/api/recruitment/team/" + tenantId + "/user-ids";
        log.debug("Resolving recruitment team user IDs for tenant {} via {}", tenantId, url);

        try {
            ResponseEntity<List<UUID>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<UUID>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<UUID> userIds = response.getBody();
                log.debug("Resolved {} recruitment team users for tenant {}", userIds.size(), tenantId);
                return userIds;
            }

            log.warn("Recruitment service returned non-success status for team lookup: {}", response.getStatusCode());
            return Collections.emptyList();
        } catch (RestClientException e) {
            log.error("Error calling recruitment service for team lookup: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Fallback when Recruitment service is unavailable for team lookup.
     */
    private List<UUID> getRecruitmentTeamUserIdsFallback(UUID tenantId, Exception e) {
        log.warn("Recruitment service unavailable for tenant {} team lookup (circuit breaker/retry exhausted): {}",
                tenantId, e.getMessage());
        return Collections.emptyList();
    }

    /**
     * Response record for user ID lookups.
     */
    record UserIdResponse(UUID userId) {}
}
