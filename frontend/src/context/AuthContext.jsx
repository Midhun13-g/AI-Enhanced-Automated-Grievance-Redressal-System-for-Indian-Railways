import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");


    useEffect(() => {
        if (token) {
            const role = localStorage.getItem("role") || "USER";
            const stationName = localStorage.getItem("stationName") || "";
            const username = localStorage.getItem("username") || "";
            const fullName = localStorage.getItem("fullName") || "";
            setUser({ token, role, stationName, username, fullName });
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (token, role, stationName, username, fullName) => {
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        if (stationName) localStorage.setItem("stationName", stationName);
        if (username) localStorage.setItem("username", username);
        if (fullName) localStorage.setItem("fullName", fullName);
        setUser({
            token,
            role,
            stationName: stationName || "",
            username: username || "",
            fullName: fullName || "",
        });
    };

    const logout = () => {
        setToken("");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("stationName");
        localStorage.removeItem("username");
        localStorage.removeItem("fullName");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
