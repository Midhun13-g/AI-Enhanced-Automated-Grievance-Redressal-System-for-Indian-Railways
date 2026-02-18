import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const StationMasterDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user?.station) {
            API.get(`/complaints/station/${user.station}`).then(res => setComplaints(res.data));
        }
    }, [user]);

    const handleStatusUpdate = (id, status) => {
        API.patch(`/complaints/${id}/status`, { newStatus: status }).then(() => {
            setComplaints(c => c.map(comp => comp.id === id ? { ...comp, status } : comp));
        });
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h2 className="text-3xl font-bold mb-4">Station Master Dashboard</h2>
            <ul>
                {complaints.map(c => (
                    <li key={c.id} className="mb-4 p-4 border rounded">
                        <div><b>Passenger:</b> {c.passengerName}</div>
                        <div><b>Complaint:</b> {c.complaintText}</div>
                        <div><b>Status:</b> {c.status}</div>
                        <button onClick={() => handleStatusUpdate(c.id, "RESOLVED")} className="bg-green-500 text-white px-2 py-1 rounded mt-2">Mark as Resolved</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StationMasterDashboard;
