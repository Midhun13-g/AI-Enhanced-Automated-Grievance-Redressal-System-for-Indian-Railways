import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");


    useEffect(() => {
        if (token) {
            const role = localStorage.getItem("role") || "PASSENGER";
            const stationName = localStorage.getItem("stationName") || "";
            setUser({ token, role, stationName });
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (token, role, stationName) => {
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        if (stationName) localStorage.setItem("stationName", stationName);
        setUser({ token, role, stationName: stationName || "" });
    };

    const logout = () => {
        setToken("");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("stationName");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
