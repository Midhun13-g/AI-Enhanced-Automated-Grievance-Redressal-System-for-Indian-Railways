import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

const Signup = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("USER");
    const [stationName, setStationName] = useState("");
    const [officerKey, setOfficerKey] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const needsStation = role === "STATION_MASTER" || role === "STATION_STAFF";
    const needsOfficerKey = role !== "USER";

    const normalizedEmail = email.trim().toLowerCase();

    const isValidEmail = (value) => /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        const normalizedFullName = fullName.trim().replace(/\s+/g, " ");

        if (normalizedFullName.length < 2) {
            setError("Enter your full name");
            return;
        }

        if (!isValidEmail(normalizedEmail)) {
            setError("Enter a valid email address");
            return;
        }

        if (!password || !confirmPassword) {
            setError("Email and password are required");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await API.post("/auth/signup", {
                fullName: normalizedFullName,
                email: normalizedEmail,
                password,
                role,
                stationName: needsStation ? stationName : undefined,
                officerKey: needsOfficerKey ? officerKey : undefined,
            });
            navigate("/login", { state: { message: "Signup successful! Login with your email." } });
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Signup failed. Please try again.");
            }
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
                    <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Sign Up</h2>
                    <p className="text-center text-gray-600 mb-6">Create your account</p>
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-4">
                            {message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
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
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">Password</label>
                            <input
                                type="password"
                                placeholder="Enter password (min 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2">Role</label>
                            <select
                                value={role}
                                onChange={(e) => { setRole(e.target.value); setStationName(""); setOfficerKey(""); }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="USER">🧑 Passenger (User)</option>
                                <option value="STATION_MASTER">🚉 Station Master</option>
                                <option value="STATION_STAFF">👷 Station Staff</option>
                                <option value="RPF_ADMIN">👮 RPF Admin</option>                            </select>
                            {role !== "USER" && (
                                <p className="text-xs text-orange-600 mt-1">
                                    {role === "STATION_MASTER" && "Controls operations of a specific station."}
                                    {role === "STATION_STAFF" && "Handles tasks assigned by the Station Master."}
                                    {role === "RPF_ADMIN" && "Monitors security complaints and officers nationwide."}                                </p>
                            )}
                        </div>
                        {needsStation && (
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">Station Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Chennai Central"
                                    value={stationName}
                                    onChange={(e) => setStationName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>
                        )}
                        {needsOfficerKey && (
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">Officer Access Key *</label>
                                <input
                                    type="password"
                                    placeholder="Enter officer key"
                                    value={officerKey}
                                    onChange={(e) => setOfficerKey(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 rounded-lg hover:from-orange-700 hover:to-orange-600 font-semibold text-lg shadow-md transition disabled:opacity-50"
                        >
                            {loading ? "Creating account..." : "Sign Up"}
                        </button>
                    </form>
                    <p className="text-center text-gray-600 mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="text-orange-600 hover:text-orange-700 font-semibold">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;

