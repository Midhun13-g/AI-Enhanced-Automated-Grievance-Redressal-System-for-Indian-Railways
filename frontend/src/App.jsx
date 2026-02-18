import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";

import Home from "./components/Home";
import ComplaintForm from "./components/ComplaintForm";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import StationMasterDashboard from "./components/StationMasterDashboard";
import EmergencyContacts from "./components/EmergencyContacts";
import ProtectedRoute from "./components/ProtectedRoute";


import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function RoleBasedHome() {
    const { user } = useContext(AuthContext);
    if (!user) return <Home />;
    if (user.role === "ADMIN") return <AdminDashboard />;
    if (user.role === "STATION_MASTER") return <StationMasterDashboard />;
    return <Home />;
}

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <RoleBasedHome />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/complaints/new"
                        element={
                            <ProtectedRoute>
                                <ComplaintForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/complaints"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/emergency-contacts"
                        element={
                            <ProtectedRoute>
                                <EmergencyContacts />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
