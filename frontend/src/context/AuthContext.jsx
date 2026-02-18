import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");

    useEffect(() => {
        if (token) {
            const role = localStorage.getItem("role") || "PASSENGER";
            const email = localStorage.getItem("email") || "User";
            setUser({ token, role, email });
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (token, role, email = "User") => {
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);
        setUser({ token, role, email });
    };

    const logout = () => {
        setToken("");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
