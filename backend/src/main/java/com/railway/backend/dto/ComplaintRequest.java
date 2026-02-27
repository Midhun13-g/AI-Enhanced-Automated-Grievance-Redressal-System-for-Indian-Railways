package com.railway.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ComplaintRequest {
    @NotBlank
    private String passengerName;
    @NotBlank
    private String passengerPhone;
    @NotBlank
    private String complaintText;
    @NotBlank
    private String trainNumber;
    @NotNull
    private LocalDateTime incidentAt;
    private String previousStation;
    private String nextStation;
    private String category;
}
