import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import ComplaintForm from "./components/ComplaintForm";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import StationMasterDashboard from "./components/StationMasterDashboard";
import StaffDashboard from "./components/StaffDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import EmergencyContacts from "./components/EmergencyContacts";

function AppRoutes() {
    const { user } = useContext(AuthContext);

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    if (user.role === "SUPER_ADMIN") {
        return (
            <Routes>
                <Route path="/" element={<SuperAdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    if (user.role === "RPF_ADMIN" || user.role === "ADMIN") {
        return (
            <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    if (user.role === "STATION_MASTER") {
        return (
            <Routes>
                <Route path="/" element={<StationMasterDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    if (user.role === "STATION_STAFF") {
        return (
            <Routes>
                <Route path="/" element={<StaffDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    // USER / PASSENGER
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/complaints/new" element={<ComplaintForm />} />
            <Route path="/complaints" element={<Dashboard />} />
            <Route path="/emergency-contacts" element={<EmergencyContacts />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
