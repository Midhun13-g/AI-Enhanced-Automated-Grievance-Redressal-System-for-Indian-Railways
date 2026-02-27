package com.railway.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementResponse {
    private Long id;
    private String station;
    private String team;
    private String message;
    private String createdBy;
    private LocalDateTime createdAt;
}
