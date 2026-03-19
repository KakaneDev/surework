package com.surework.tenant.dto;

import jakarta.validation.constraints.*;

public sealed interface TenantSetupDto {

    record CompanyDetailsRequest(
        @NotBlank @Pattern(regexp = "\\d{4}/\\d{6}/\\d{2}")
        String registrationNumber,

        @Size(max = 200)
        String tradingName,

        @NotBlank
        String industrySector,

        @NotBlank @Pattern(regexp = "^\\+27[0-9]{9}$")
        String phone,

        @NotBlank @Email
        String companyEmail,

        @NotBlank @Size(max = 500)
        String streetAddress,

        @NotBlank @Size(max = 100)
        String city,

        @NotBlank
        String province,

        @NotBlank @Pattern(regexp = "\\d{4}")
        String postalCode
    ) implements TenantSetupDto {}

    record ComplianceDetailsRequest(
        @NotBlank @Pattern(regexp = "\\d{10}")
        String taxNumber,

        @Pattern(regexp = "4\\d{9}")
        String vatNumber,

        @NotBlank @Pattern(regexp = "U\\d{8}")
        String uifReference,

        @NotBlank @Pattern(regexp = "L\\d{8}")
        String sdlNumber,

        @NotBlank @Pattern(regexp = "\\d{7}/\\d{3}/\\d{4}")
        String payeReference
    ) implements TenantSetupDto {}

    record SetupStatusResponse(
        boolean companyDetailsComplete,
        boolean complianceDetailsComplete
    ) implements TenantSetupDto {}

    record CompanyDetailsResponse(
        String registrationNumber,
        String tradingName,
        String industrySector,
        String phone,
        String companyEmail,
        String streetAddress,
        String city,
        String province,
        String postalCode
    ) implements TenantSetupDto {}

    record ComplianceDetailsResponse(
        String taxNumber,
        String vatNumber,
        String uifReference,
        String sdlNumber,
        String payeReference
    ) implements TenantSetupDto {}
}
