package com.railway.backend.dto;

import lombok.Data;

@Data
public class FeedbackRequest {
    private String userEmail;
    private String message;
    private String type; // appreciation, complaint, etc.
}
