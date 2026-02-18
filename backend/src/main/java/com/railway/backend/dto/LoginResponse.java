package com.railway.backend.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String role;
    private String email;
}
