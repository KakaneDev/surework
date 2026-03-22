package com.surework.reporting.client.dto;

import java.util.UUID;

/**
 * Department data transfer object from Employee Service.
 */
public record DepartmentDto(
        UUID id,
        String code,
        String name,
        String description,
        boolean active
) {}
