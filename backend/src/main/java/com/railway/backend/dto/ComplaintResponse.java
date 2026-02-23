package com.railway.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ComplaintResponse {
    private Long id;
    private String passengerName;
    private String complaintText;
    private String category;
    private Integer urgencyScore;
    private String status;
    private String station;
    private String department;
    private String assignedTo;
    private String remarks;
    private String aiMetadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
