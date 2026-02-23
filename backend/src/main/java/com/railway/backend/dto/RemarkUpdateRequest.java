package com.railway.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RemarkUpdateRequest {
    @NotBlank
    private String remarks;
}
