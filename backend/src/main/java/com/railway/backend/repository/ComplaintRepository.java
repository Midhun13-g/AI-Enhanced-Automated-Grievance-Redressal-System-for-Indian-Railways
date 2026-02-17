package com.railway.backend.repository;

import com.railway.backend.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByOrderByUrgencyScoreDesc();

    List<Complaint> findByStatusOrderByUrgencyScoreDesc(String status);

    @Query(value = "SELECT * FROM complaints WHERE to_tsvector('english', complaint_text) @@ plainto_tsquery('english', :query)", nativeQuery = true)
    List<Complaint> fullTextSearch(@Param("query") String query);
}
