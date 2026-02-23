package com.railway.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "passenger_name", nullable = false)
    private String passengerName;

    @Column(name = "complaint_text", nullable = false, columnDefinition = "TEXT")
    private String complaintText;

    @Column
    private String category;

    @Column(name = "urgency_score")
    private Integer urgencyScore;

    @Column(name = "station")
    private String station;

    @Column(name = "department")
    private String department;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(nullable = false)
    private String status;

    @Column(name = "ai_metadata", columnDefinition = "jsonb")
    private String aiMetadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
