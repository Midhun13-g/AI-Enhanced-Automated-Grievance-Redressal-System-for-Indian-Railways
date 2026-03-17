package com.railway.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KafkaComplaintMessage {
    private Long id;
    private String complaintText;
    private String trainNumber;
    private String previousStation;
    private String nextStation;
}
