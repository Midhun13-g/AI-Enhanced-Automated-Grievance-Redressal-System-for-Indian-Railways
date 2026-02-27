package com.railway.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @Column(name = "passenger_phone")
    private String passengerPhone;

    @Column(name = "created_by_username")
    private String createdByUsername;

    @Column(name = "complaint_text", nullable = false, columnDefinition = "TEXT")
    private String complaintText;

    @Column
    private String category;

    @Column(name = "urgency_score")
    private Integer urgencyScore;

    @Column(name = "station")
    private String station;

    @Column(name = "previous_station")
    private String previousStation;

    @Column(name = "next_station")
    private String nextStation;

    @Column(name = "department")
    private String department;

    @Column(name = "train_number")
    private String trainNumber;

    @Column(name = "incident_at")
    private LocalDateTime incidentAt;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "resolved_by_role")
    private String resolvedByRole;

    @Column(nullable = false)
    private String status;

    @Column(name = "ai_metadata", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
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
