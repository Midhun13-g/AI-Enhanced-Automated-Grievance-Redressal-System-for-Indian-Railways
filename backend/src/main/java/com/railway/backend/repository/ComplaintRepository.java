package com.railway.backend.repository;

import com.railway.backend.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByOrderByUrgencyScoreDesc();

    List<Complaint> findByCreatedByUsernameOrderByUrgencyScoreDesc(String createdByUsername);

    List<Complaint> findByPassengerNameIgnoreCaseOrderByUrgencyScoreDesc(String passengerName);

    List<Complaint> findByStatusOrderByUrgencyScoreDesc(String status);

    List<Complaint> findByStation(String station);

    @Query("""
            SELECT c FROM Complaint c
            WHERE LOWER(TRIM(COALESCE(c.station, ''))) = LOWER(TRIM(:station))
               OR LOWER(TRIM(COALESCE(c.previousStation, ''))) = LOWER(TRIM(:station))
               OR LOWER(TRIM(COALESCE(c.nextStation, ''))) = LOWER(TRIM(:station))
            ORDER BY COALESCE(c.urgencyScore, 0) DESC
            """)
    List<Complaint> findByStationContext(@Param("station") String station);

    List<Complaint> findByDepartment(String department);

    List<Complaint> findByAssignedTo(String assignedTo);

    @Query("""
            SELECT
            CASE
                WHEN c.department IS NULL OR TRIM(c.department) = ''
                    THEN CASE
                        WHEN c.category IS NULL OR TRIM(c.category) = ''
                            THEN 'General'
                        ELSE c.category
                    END
                ELSE c.department
            END,
            COUNT(c)
            FROM Complaint c
            GROUP BY
            CASE
                WHEN c.department IS NULL OR TRIM(c.department) = ''
                    THEN CASE
                        WHEN c.category IS NULL OR TRIM(c.category) = ''
                            THEN 'General'
                        ELSE c.category
                    END
                ELSE c.department
            END
            """)
    List<Object[]> countComplaintsByDepartment();

    @Query("SELECT c.complaintText, COUNT(c) as cnt FROM Complaint c GROUP BY c.complaintText ORDER BY cnt DESC LIMIT 5")
    List<Object[]> findTopComplaintIssues();

    @Query(value = "SELECT * FROM complaints WHERE to_tsvector('english', complaint_text) @@ plainto_tsquery('english', :query)", nativeQuery = true)
    List<Complaint> fullTextSearch(@Param("query") String query);
}
