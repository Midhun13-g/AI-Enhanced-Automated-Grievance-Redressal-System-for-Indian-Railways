package com.railway.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ComplaintResponse {
    private Long id;
    private String passengerName;
    private String passengerPhone;
    private String complaintText;
    private String category;
    private Integer urgencyScore;
    private String status;
    private String station;
    private String previousStation;
    private String nextStation;
    private String department;
    private String trainNumber;
    private LocalDateTime incidentAt;
    private String assignedTo;
    private String remarks;
    private String resolvedBy;
    private String resolvedByRole;
    private String aiMetadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
