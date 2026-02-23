import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "./Navbar";

const ComplaintForm = () => {
    const navigate = useNavigate();
    const context = useContext(AuthContext);
    const logoutFn = context?.logout;
    const [passengerName, setPassengerName] = useState("");
    const [complaintText, setComplaintText] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        logoutFn();
        navigate("/login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            await API.post("/complaints", { passengerName, complaintText });
            setSuccess("Complaint submitted successfully!");
            setPassengerName("");
            setComplaintText("");
            setTimeout(() => {
                navigate("/complaints");
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit complaint");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onLogout={handleLogout} />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <section className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-xl border border-orange-200 p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 text-orange-700 text-2xl shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0v6.75A2.25 2.25 0 0114.25 19.5h-4.5A2.25 2.25 0 017.5 17.25V10.5m9 0h-9" />
                            </svg>
                        </span>
                        <h2 className="text-2xl font-bold text-[#7b1f2b] tracking-tight">Lodge Your Grievance</h2>
                    </div>
                    <p className="text-gray-600 mb-6">Submit your complaint and we'll address it promptly.</p>
                    {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Passenger Name <span className="text-orange-600">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={passengerName}
                                    onChange={(e) => setPassengerName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25V19.5z" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Complaint Details <span className="text-orange-600">*</span></label>
                            <textarea
                                placeholder="Describe your grievance in detail..."
                                value={complaintText}
                                onChange={(e) => setComplaintText(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto bg-gradient-to-r from-[#7b1f2b] to-[#f57c00] text-white px-8 py-3 rounded-lg hover:from-orange-700 hover:to-orange-600 font-semibold text-lg shadow-md transition disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : "Submit Grievance"}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default ComplaintForm;
