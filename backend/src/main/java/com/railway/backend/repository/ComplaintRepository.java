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

    List<Complaint> findByDepartment(String department);

    List<Complaint> findByAssignedTo(String assignedTo);

    @Query("SELECT c.department, COUNT(c) FROM Complaint c GROUP BY c.department")
    List<Object[]> countComplaintsByDepartment();

    @Query("SELECT c.complaintText, COUNT(c) as cnt FROM Complaint c GROUP BY c.complaintText ORDER BY cnt DESC LIMIT 5")
    List<Object[]> findTopComplaintIssues();

    @Query(value = "SELECT * FROM complaints WHERE to_tsvector('english', complaint_text) @@ plainto_tsquery('english', :query)", nativeQuery = true)
    List<Complaint> fullTextSearch(@Param("query") String query);
}
