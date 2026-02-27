import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const SECTIONS = ["My Tasks", "History", "Profile"];
const ICONS = { "My Tasks": "🔧", History: "📜", Profile: "👤" };

const StatusBadge = ({ status }) => {
    const map = {
        RESOLVED: "bg-green-100 text-green-700",
        IN_PROGRESS: "bg-yellow-100 text-yellow-700",
        PENDING: "bg-blue-100 text-blue-700",
        COMPLETED: "bg-green-100 text-green-700",
    };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
};

const StaffDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState("My Tasks");
    const [remarkInput, setRemarkInput] = useState({});
    const [activeRemark, setActiveRemark] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");

    const staffName = user?.username || "";
    const stationName = user?.stationName || "Your Station";

    const handleLogout = () => { logout(); navigate("/login"); };

    useEffect(() => {
        if (!staffName) return;
        API.get(`/complaints/assigned-to/${encodeURIComponent(staffName)}`)
            .then(res => { setComplaints(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [staffName]);

    const handleStatusUpdate = (id, newStatus) => {
        API.patch(`/complaints/${id}/status`, { newStatus })
            .then((res) => {
                setComplaints(c => c.map(comp => comp.id === id ? res.data : comp));
                showSuccess("Status updated!");
            })
            .catch(() => { });
    };

    const handleAddRemark = (id) => {
        const remark = remarkInput[id];
        if (!remark?.trim()) return;
        API.patch(`/complaints/${id}/remarks`, { remarks: remark.trim() })
            .then(() => {
                setComplaints(c => c.map(comp => comp.id === id ? { ...comp, remarks: remark.trim() } : comp));
                setActiveRemark(null);
                setRemarkInput(prev => ({ ...prev, [id]: "" }));
                showSuccess("Remark saved!");
            })
            .catch(() => { });
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const activeTasks = complaints.filter(c => c.status !== "RESOLVED");
    const completedTasks = complaints.filter(c => c.status === "RESOLVED");

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar — indigo theme for staff */}
            <aside className="w-64 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white flex flex-col shadow-xl flex-shrink-0">
                <div className="p-5 border-b border-indigo-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg">👷</div>
                        <div>
                            <div className="font-bold text-white text-sm">RailMadad</div>
                            <div className="text-indigo-200 text-xs">Station Staff Portal</div>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {SECTIONS.map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition text-sm font-medium ${activeSection === section ? "bg-yellow-400 text-indigo-900 shadow font-bold" : "text-indigo-100 hover:bg-indigo-600 hover:text-white"}`}
                        >
                            <span className="text-lg">{ICONS[section]}</span>
                            {section}
                            {section === "My Tasks" && activeTasks.length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeTasks.length}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-indigo-600">
                    <div className="text-indigo-200 text-xs mb-3 text-center">Role: Station Staff</div>
                    <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">🚪 Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-indigo-100">
                    <h1 className="text-xl font-bold text-gray-800">{ICONS[activeSection]} {activeSection}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-indigo-600 font-medium">🚉 {stationName}</span>
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {staffName[0]?.toUpperCase() || "S"}
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {successMsg && (
                        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{successMsg}</div>
                    )}

                    {/* ===== MY TASKS ===== */}
                    {activeSection === "My Tasks" && (
                        <div>
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { label: "Assigned to Me", value: complaints.length, color: "border-indigo-500", text: "text-indigo-600" },
                                    { label: "Active Tasks", value: activeTasks.length, color: "border-yellow-500", text: "text-yellow-600" },
                                    { label: "Completed", value: completedTasks.length, color: "border-green-500", text: "text-green-600" },
                                ].map(s => (
                                    <div key={s.label} className={`bg-white rounded-xl shadow p-6 border-l-4 ${s.color}`}>
                                        <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
                                        <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {loading ? (
                                <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">Loading tasks...</div>
                            ) : activeTasks.length === 0 ? (
                                <div className="bg-white rounded-xl shadow p-12 text-center">
                                    <div className="text-5xl mb-4">✅</div>
                                    <p className="text-gray-500 text-lg">All tasks completed! Great work.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeTasks.map(c => (
                                        <div key={c.id} className="bg-white rounded-xl shadow p-6 border border-gray-100 hover:border-indigo-200 transition">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-indigo-600 font-bold text-sm">Task #{c.id}</span>
                                                        <StatusBadge status={c.status} />
                                                        {c.department && (
                                                            <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded">{c.department}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-800 font-medium">{c.complaintText}</p>
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        👤 {c.passengerName} · 📅 {c.createdAt?.split("T")[0]} · 🚉 {c.station || stationName}
                                                    </p>
                                                    {c.remarks && (
                                                        <p className="text-gray-500 text-sm italic mt-2 bg-gray-50 px-3 py-1 rounded">
                                                            📝 Remark: {c.remarks}
                                                        </p>
                                                    )}
                                                    {activeRemark === c.id && (
                                                        <div className="mt-3 flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Add your remark..."
                                                                value={remarkInput[c.id] || ""}
                                                                onChange={e => setRemarkInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:ring-2 focus:ring-indigo-400 outline-none"
                                                            />
                                                            <button onClick={() => handleAddRemark(c.id)}
                                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700">Save</button>
                                                            <button onClick={() => setActiveRemark(null)}
                                                                className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 ml-6">
                                                    {c.status !== "IN_PROGRESS" && (
                                                        <button onClick={() => handleStatusUpdate(c.id, "IN_PROGRESS")}
                                                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 font-semibold whitespace-nowrap">
                                                            ▶ Start Task
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                                                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 font-semibold">
                                                        ✅ Complete
                                                    </button>
                                                    <button onClick={() => setActiveRemark(activeRemark === c.id ? null : c.id)}
                                                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                                                        📝 Remark
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== HISTORY ===== */}
                    {activeSection === "History" && (
                        <div className="bg-white rounded-xl shadow">
                            <div className="p-5 border-b">
                                <h3 className="font-bold text-gray-800">Completed Tasks ({completedTasks.length})</h3>
                            </div>
                            {completedTasks.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">No completed tasks yet.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="py-3 px-4 text-left">#</th>
                                                <th className="py-3 px-4 text-left">Complaint</th>
                                                <th className="py-3 px-4 text-left">Passenger</th>
                                                <th className="py-3 px-4 text-left">Department</th>
                                                <th className="py-3 px-4 text-left">Resolved By</th>
                                                <th className="py-3 px-4 text-left">Remarks</th>
                                                <th className="py-3 px-4 text-left">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {completedTasks.map(c => (
                                                <tr key={c.id} className="border-b hover:bg-indigo-50">
                                                    <td className="py-3 px-4 text-indigo-600 font-semibold">#{c.id}</td>
                                                    <td className="py-3 px-4 max-w-xs truncate">{c.complaintText}</td>
                                                    <td className="py-3 px-4">{c.passengerName}</td>
                                                    <td className="py-3 px-4 text-gray-400">{c.department || "—"}</td>                                                    <td className="py-3 px-4 text-gray-500 text-xs">
                                                        {c.resolvedBy ? `${c.resolvedBy}${c.resolvedByRole ? ` (${c.resolvedByRole})` : ""}` : "�"}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-500 italic text-xs">{c.remarks || "—"}</td>
                                                    <td className="py-3 px-4 text-gray-400">{c.updatedAt?.split("T")[0]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== PROFILE ===== */}
                    {activeSection === "Profile" && (
                        <div className="max-w-md mx-auto">
                            <div className="bg-white rounded-xl shadow p-8 text-center">
                                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">👷</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{staffName}</h2>
                                <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full mt-2">STATION STAFF</span>
                                <div className="mt-6 space-y-3 text-left">
                                    <div className="flex justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="text-gray-500 text-sm">Station</span>
                                        <span className="font-semibold text-sm">{stationName}</span>
                                    </div>
                                    <div className="flex justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="text-gray-500 text-sm">Total Tasks</span>
                                        <span className="font-semibold text-sm">{complaints.length}</span>
                                    </div>
                                    <div className="flex justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="text-gray-500 text-sm">Completed</span>
                                        <span className="font-semibold text-sm text-green-600">{completedTasks.length}</span>
                                    </div>
                                    <div className="flex justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="text-gray-500 text-sm">Pending</span>
                                        <span className="font-semibold text-sm text-yellow-600">{activeTasks.length}</span>
                                    </div>
                                    <div className="flex justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="text-gray-500 text-sm">Completion Rate</span>
                                        <span className="font-semibold text-sm text-indigo-600">
                                            {complaints.length ? Math.round((completedTasks.length / complaints.length) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;

