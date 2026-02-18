import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState({});
    const [topIssues, setTopIssues] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        API.get("/departments/analytics/by-department").then(res => setAnalytics(res.data));
        API.get("/departments/analytics/top-issues").then(res => setTopIssues(res.data));
    }, []);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h2 className="text-3xl font-bold mb-4">Admin Analytics Dashboard</h2>
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Complaints by Department</h3>
                <ul>
                    {Object.entries(analytics).map(([dept, count]) => (
                        <li key={dept}>{dept}: <span className="font-bold">{count}</span></li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-2">Top Complaint Issues</h3>
                <ol>
                    {topIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                    ))}
                </ol>
            </div>
        </div>
    );
};

export default AdminDashboard;
