package com.railway.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotBlank
    private String newStatus;
}
