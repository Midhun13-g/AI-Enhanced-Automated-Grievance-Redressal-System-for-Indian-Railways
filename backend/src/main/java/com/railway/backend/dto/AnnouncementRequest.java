package com.railway.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnnouncementRequest {
    @NotBlank
    private String station;
    @NotBlank
    private String team;
    @NotBlank
    private String message;
}
