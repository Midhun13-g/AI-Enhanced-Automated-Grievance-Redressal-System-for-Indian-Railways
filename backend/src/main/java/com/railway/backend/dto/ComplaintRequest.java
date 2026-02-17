package com.railway.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintRequest {
    @NotBlank
    private String passengerName;
    @NotBlank
    private String complaintText;
    private String category;
}
