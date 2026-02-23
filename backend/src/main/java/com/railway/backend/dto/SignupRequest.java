package com.railway.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    private String email;
    private String password;
    private String role; // USER, STATION_MASTER, STATION_STAFF, RPF_ADMIN, SUPER_ADMIN
    private String stationName; // station for STATION_MASTER / STATION_STAFF
    private String officerKey; // required for privileged roles
}
