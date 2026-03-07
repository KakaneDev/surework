package com.surework.tenant.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Set;
import java.util.UUID;

/**
 * REST client for communicating with identity-service.
 * Used for user creation during tenant signup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IdentityServiceClient {

    private final RestTemplate restTemplate;

    @Value("${surework.services.identity-service.url:http://localhost:8082}")
    private String identityServiceUrl;

    /**
     * Request to create a user in identity-service.
     */
    public record CreateUserRequest(
            String email,
            String firstName,
            String lastName,
            String phone,
            Set<String> roles,
            UUID employeeId,
            String password,
            UUID tenantId
    ) {}

    /**
     * Response from identity-service user creation.
     */
    public record UserResponse(
            UUID id,
            String email,
            String firstName,
            String lastName,
            String fullName,
            String status,
            Set<String> roles
    ) {}

    /**
     * Request to check if an email is available.
     */
    public record EmailAvailabilityResponse(
            boolean available
    ) {}

    /**
     * Creates an admin user for the newly created tenant.
     *
     * @param email       the admin email
     * @param password    the admin password (hashed by identity-service)
     * @param firstName   the admin first name
     * @param lastName    the admin last name
     * @param phone       the admin phone
     * @param tenantId    the tenant ID
     * @return the created user, or null if creation failed
     */
    public UserResponse createTenantAdmin(
            String email,
            String password,
            String firstName,
            String lastName,
            String phone,
            UUID tenantId
    ) {
        try {
            CreateUserRequest request = new CreateUserRequest(
                    email,
                    firstName,
                    lastName,
                    phone,
                    Set.of("TENANT_ADMIN"),
                    null,
                    password,
                    tenantId
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Internal service-to-service call - use service account context
            headers.set("X-Service-Name", "tenant-service");
            headers.set("X-Tenant-Id", tenantId.toString());

            HttpEntity<CreateUserRequest> entity = new HttpEntity<>(request, headers);

            String url = identityServiceUrl + "/api/v1/users/signup";
            ResponseEntity<UserResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    UserResponse.class
            );

            log.info("Created tenant admin user for tenant {}: userId={}", tenantId,
                    response.getBody() != null ? response.getBody().id() : "unknown");
            return response.getBody();

        } catch (RestClientException e) {
            log.error("Failed to create tenant admin for tenant {}: {}", tenantId, e.getMessage());
            throw new RuntimeException("Failed to create admin user: " + e.getMessage(), e);
        }
    }

    /**
     * Checks if an email is available across all tenants.
     *
     * @param email the email to check
     * @return true if the email is available (defaults to true on error to not block signup)
     */
    public boolean isEmailAvailable(String email) {
        try {
            String url = identityServiceUrl + "/api/v1/users/email-available?email=" + email;
            ResponseEntity<EmailAvailabilityResponse> response = restTemplate.getForEntity(
                    url,
                    EmailAvailabilityResponse.class
            );

            return response.getBody() != null && response.getBody().available();

        } catch (RestClientException e) {
            log.warn("Failed to check email availability for {}: {}. Allowing signup to proceed.", email, e.getMessage());
            // Return true on error to not block signup - duplicate check will fail at actual signup time
            return true;
        }
    }
}
