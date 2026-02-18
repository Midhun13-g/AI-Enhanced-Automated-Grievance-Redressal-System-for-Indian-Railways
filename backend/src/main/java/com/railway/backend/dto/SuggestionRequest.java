package com.railway.backend.dto;

import lombok.Data;

@Data
public class SuggestionRequest {
    private String userEmail;
    private String message;
}
