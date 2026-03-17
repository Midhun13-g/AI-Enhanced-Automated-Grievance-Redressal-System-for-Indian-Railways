package com.railway.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintClassificationUpdateRequest {
    private String department;
    private String priority;
    private Integer urgencyScore;
    private String aiMetadata;
}
