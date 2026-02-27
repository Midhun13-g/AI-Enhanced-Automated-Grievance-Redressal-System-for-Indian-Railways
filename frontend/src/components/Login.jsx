import React, { useState, useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const context = useContext(AuthContext);
    const login = context?.login;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const successMessage = location.state?.message;

    const fallbackNameFromEmail = (value) => {
        const localPart = (value || "").split("@")[0];
        return localPart
            .split(/[._-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ") || "User";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const res = await API.post("/auth/login", { email: normalizedEmail, password });
            login(
                res.data.token,
                res.data.role,
                res.data.stationName || "",
                res.data.email || normalizedEmail,
                res.data.fullName || fallbackNameFromEmail(normalizedEmail)
            );
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 py-4 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-xl">🚂</span>
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-2xl">RailMadad</h1>
                        <p className="text-orange-100 text-sm">Railway Grievance Redressal System</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center py-12 px-4">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border-t-4 border-orange-600">
                    <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Login</h2>
                    <p className="text-center text-gray-600 mb-6">Access your grievance portal</p>
                    {successMessage && (
                        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-4">
                            {successMessage}
                        </div>
                    )}
                    {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2">Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 rounded-lg hover:from-orange-700 hover:to-orange-600 font-semibold text-lg shadow-md transition disabled:opacity-50"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                    <p className="text-center text-gray-600 mt-6">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-orange-600 hover:text-orange-700 font-semibold">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
