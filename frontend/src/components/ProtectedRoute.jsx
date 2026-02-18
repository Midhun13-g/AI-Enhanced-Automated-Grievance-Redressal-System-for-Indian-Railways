import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const context = useContext(AuthContext);
    const navigate = useNavigate();
    const user = context?.user;
    
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

export default ProtectedRoute;
