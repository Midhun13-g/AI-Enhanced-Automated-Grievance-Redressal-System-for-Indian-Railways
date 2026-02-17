import React from "react";

const StatusBadge = ({ urgency }) => {
    let color = "bg-green-500";
    let label = "Low";
    if (urgency > 80) {
        color = "bg-red-600";
        label = "High";
    } else if (urgency > 40) {
        color = "bg-yellow-400";
        label = "Medium";
    }
    return (
        <span className={`px-3 py-1 rounded text-white text-xs font-bold ${color}`}>{label}</span>
    );
};

export default StatusBadge;
