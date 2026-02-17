import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");

    useEffect(() => {
        if (token) {
            const role = localStorage.getItem("role") || "PASSENGER";
            const username = localStorage.getItem("username") || "User";
            setUser({ token, role, username });
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (token, role, username = "User") => {
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("username", username);
        setUser({ token, role, username });
        window.location.href = "/";
    };

    const logout = () => {
        setToken("");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
