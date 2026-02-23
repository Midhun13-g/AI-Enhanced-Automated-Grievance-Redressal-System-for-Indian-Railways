import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import StatusBadge from "./StatusBadge";
import { AuthContext } from "../context/AuthContext";
import Navbar from "./Navbar";

const Dashboard = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const context = useContext(AuthContext);
    const logoutFn = context?.logout;

    const handleLogout = () => {
        logoutFn();
        navigate("/login");
    };

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const res = await API.get("/complaints");
            setComplaints(res.data);
        } catch (err) {
            console.error("Failed to fetch complaints", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onLogout={handleLogout} />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Complaints Dashboard</h2>
                            <p className="text-gray-600">View and track all submitted complaints</p>
                        </div>
                        <Link
                            to="/complaints/new"
                            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-orange-600 font-semibold shadow-md transition"
                        >
                            + New Complaint
                        </Link>
                    </div>
                </div>
                {loading ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-gray-500 text-lg">Loading complaints...</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-semibold">ID</th>
                                        <th className="py-3 px-4 text-left font-semibold">Passenger</th>
                                        <th className="py-3 px-4 text-left font-semibold">Complaint</th>
                                        <th className="py-3 px-4 text-left font-semibold">Category</th>
                                        <th className="py-3 px-4 text-left font-semibold">Urgency</th>
                                        <th className="py-3 px-4 text-left font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-gray-500">
                                                No complaints found. <Link to="/complaints/new" className="text-orange-600 hover:underline">Submit your first grievance</Link>.
                                            </td>
                                        </tr>
                                    ) : (
                                        complaints.map((c) => (
                                            <tr key={c.id} className="border-b hover:bg-orange-50 transition">
                                                <td className="py-3 px-4 font-semibold text-orange-600">#{c.id}</td>
                                                <td className="py-3 px-4">{c.passengerName}</td>
                                                <td className="py-3 px-4 max-w-xs truncate">{c.complaintText}</td>
                                                <td className="py-3 px-4">
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                                        {c.category || "General"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4"><StatusBadge urgency={c.urgencyScore} /></td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                                                        c.status === "RESOLVED" ? "bg-green-100 text-green-800" :
                                                        c.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-gray-100 text-gray-800"
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
