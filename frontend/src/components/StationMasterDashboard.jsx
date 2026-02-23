import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const SECTIONS = ["Dashboard", "Complaints", "SOS Alerts", "Staff Management", "Reports"];
const ICONS = { Dashboard: "🏠", Complaints: "📋", "SOS Alerts": "🚨", "Staff Management": "👷", Reports: "📢" };

const StatusBadge = ({ status }) => {
    const map = {
        RESOLVED: "bg-green-100 text-green-700",
        IN_PROGRESS: "bg-yellow-100 text-yellow-700",
        PENDING: "bg-red-100 text-red-700",
        ESCALATED: "bg-purple-100 text-purple-700",
    };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
};

const StationMasterDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState("Dashboard");
    const [filterStatus, setFilterStatus] = useState("");
    const [escalatedIds, setEscalatedIds] = useState([]);
    const [remarkMap, setRemarkMap] = useState({});
    const [activeRemark, setActiveRemark] = useState(null);
    const [staff, setStaff] = useState([
        { id: 1, name: "Ramesh Kumar", role: "Platform Supervisor", cases: 0, present: true },
        { id: 2, name: "Priya Singh", role: "Sanitation Head", cases: 0, present: true },
        { id: 3, name: "Anil Yadav", role: "Security Guard", cases: 0, present: false },
        { id: 4, name: "Meena Devi", role: "Ticket Checker", cases: 0, present: true },
    ]);
    const [assignMap, setAssignMap] = useState({});
    const [announcement, setAnnouncement] = useState({ team: "Cleaning", message: "" });
    const [announcementLog, setAnnouncementLog] = useState([]);
    const [opIssues, setOpIssues] = useState({
        platform: "Normal", water: "Normal", electricity: "Normal", maintenance: "Pending",
    });
    const [newStaff, setNewStaff] = useState({ name: "", role: "" });
    const [staffMsg, setStaffMsg] = useState("");

    const stationName = user?.stationName || user?.station || "Your Station";

    const handleLogout = () => { logout(); navigate("/login"); };

    useEffect(() => {
        const url = stationName && stationName !== "Your Station"
            ? `/complaints/station/${encodeURIComponent(stationName)}`
            : "/complaints";
        API.get(url)
            .then(res => { setComplaints(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [stationName]);

    const handleStatusUpdate = (id, newStatus) => {
        API.patch(`/complaints/${id}/status`, { newStatus })
            .then(() => setComplaints(c => c.map(comp => comp.id === id ? { ...comp, status: newStatus } : comp)))
            .catch(() => { });
    };


    const handleEscalate = (id) => {
        handleStatusUpdate(id, "IN_PROGRESS");
        setEscalatedIds(prev => [...prev, id]);
    };

    const handleAssign = (complaintId, staffId) => {
        const officer = staff.find(s => s.id === Number(staffId));
        if (!officer) return;
        setAssignMap(prev => ({ ...prev, [complaintId]: officer.name }));
        setStaff(prev => prev.map(s => s.id === officer.id ? { ...s, cases: s.cases + 1 } : s));
        handleStatusUpdate(complaintId, "IN_PROGRESS");
    };

    const handleSendAnnouncement = (e) => {
        e.preventDefault();
        if (!announcement.message.trim()) return;
        const entry = { ...announcement, time: new Date().toLocaleTimeString(), id: Date.now() };
        setAnnouncementLog(prev => [entry, ...prev]);
        setAnnouncement(a => ({ ...a, message: "" }));
    };

    const handleAddStaff = (e) => {
        e.preventDefault();
        if (!newStaff.name || !newStaff.role) return;
        setStaff(prev => [...prev, { id: Date.now(), ...newStaff, cases: 0, present: true }]);
        setNewStaff({ name: "", role: "" });
        setStaffMsg("Staff member added!");
        setTimeout(() => setStaffMsg(""), 3000);
    };

    const filteredComplaints = complaints.filter(c =>
        filterStatus ? (escalatedIds.includes(c.id) ? "ESCALATED" : c.status) === filterStatus : true
    );

    const sosComplaints = complaints.filter(c =>
        (c.complaintText || "").toLowerCase().includes("sos") ||
        (c.complaintText || "").toLowerCase().includes("emergency") ||
        (c.complaintText || "").toLowerCase().includes("help") ||
        (c.urgencyScore || 0) >= 8
    );

    const today = new Date().toISOString().split("T")[0];
    const todayCount = complaints.filter(c => c.createdAt?.startsWith(today)).length;
    const resolutionRate = complaints.length
        ? Math.round((complaints.filter(c => c.status === "RESOLVED").length / complaints.length) * 100)
        : 0;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar — teal/emerald theme (distinct from RPF Admin slate/orange) */}
            <aside className="w-64 bg-gradient-to-b from-teal-700 to-emerald-900 text-white flex flex-col shadow-xl flex-shrink-0">
                <div className="p-5 border-b border-teal-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg">🚉</div>
                        <div>
                            <div className="font-bold text-white text-sm">RailMadad</div>
                            <div className="text-teal-200 text-xs truncate max-w-[130px]">{stationName}</div>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {SECTIONS.map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition text-sm font-medium ${activeSection === section ? "bg-yellow-400 text-teal-900 shadow font-bold" : "text-teal-100 hover:bg-teal-600 hover:text-white"}`}
                        >
                            <span className="text-lg">{ICONS[section]}</span>
                            {section}
                            {section === "SOS Alerts" && sosComplaints.length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{sosComplaints.length}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-teal-600">
                    <div className="text-teal-200 text-xs mb-3 text-center">Role: Station Master</div>
                    <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">🚪 Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-teal-100">
                    <h1 className="text-xl font-bold text-gray-800">{ICONS[activeSection]} {activeSection}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-teal-600 font-medium">🚉 {stationName}</span>
                        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">SM</div>
                    </div>
                </div>

                <div className="p-8">
                    {/* ===== DASHBOARD ===== */}
                    {activeSection === "Dashboard" && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                {[
                                    { label: "Total Complaints", value: complaints.length, color: "border-teal-500", text: "text-teal-600" },
                                    { label: "Pending", value: complaints.filter(c => c.status === "PENDING").length, color: "border-red-500", text: "text-red-600" },
                                    { label: "Resolved", value: complaints.filter(c => c.status === "RESOLVED").length, color: "border-green-500", text: "text-green-600" },
                                    { label: "Escalated to RPF", value: escalatedIds.length, color: "border-purple-500", text: "text-purple-600" },
                                    { label: "Active SOS", value: sosComplaints.length, color: "border-orange-500", text: "text-orange-600" },
                                ].map(s => (
                                    <div key={s.label} className={`bg-white rounded-xl shadow p-5 border-l-4 ${s.color}`}>
                                        <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
                                        <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Resolution bar */}
                            <div className="bg-white rounded-xl shadow p-6 mb-8">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-700">Station Resolution Rate</span>
                                    <span className="font-bold text-green-600 text-lg">{resolutionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div className="bg-teal-500 h-4 rounded-full transition-all" style={{ width: `${resolutionRate}%` }} />
                                </div>
                            </div>

                            {/* Station Operations Panel */}
                            <div className="bg-white rounded-xl shadow p-6 mb-8">
                                <h3 className="font-bold text-gray-800 mb-4">⚙️ Station Operations Status</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { key: "platform", label: "Platform", icon: "🛤️" },
                                        { key: "water", label: "Water / Sanitation", icon: "💧" },
                                        { key: "electricity", label: "Electricity", icon: "⚡" },
                                        { key: "maintenance", label: "Maintenance", icon: "🔧" },
                                    ].map(op => (
                                        <div key={op.key} className="border rounded-lg p-4">
                                            <div className="text-2xl mb-1">{op.icon}</div>
                                            <div className="text-sm font-semibold text-gray-700">{op.label}</div>
                                            <select
                                                value={opIssues[op.key]}
                                                onChange={e => setOpIssues(prev => ({ ...prev, [op.key]: e.target.value }))}
                                                className={`mt-2 text-xs font-bold rounded px-2 py-1 border-0 outline-none w-full ${opIssues[op.key] === "Normal" ? "bg-green-100 text-green-700" : opIssues[op.key] === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent complaints */}
                            <div className="bg-white rounded-xl shadow">
                                <div className="p-5 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Recent Complaints (Today: {todayCount})</h3>
                                    <button onClick={() => setActiveSection("Complaints")} className="text-teal-600 text-sm hover:underline">View All →</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="py-3 px-4 text-left">#</th>
                                                <th className="py-3 px-4 text-left">Passenger</th>
                                                <th className="py-3 px-4 text-left">Complaint</th>
                                                <th className="py-3 px-4 text-left">Status</th>
                                                <th className="py-3 px-4 text-left">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="5" className="py-6 text-center text-gray-400">Loading...</td></tr>
                                            ) : complaints.slice(0, 5).map(c => (
                                                <tr key={c.id} className="border-b hover:bg-teal-50">
                                                    <td className="py-3 px-4 text-teal-600 font-semibold">#{c.id}</td>
                                                    <td className="py-3 px-4">{c.passengerName}</td>
                                                    <td className="py-3 px-4 max-w-xs truncate">{c.complaintText}</td>
                                                    <td className="py-3 px-4"><StatusBadge status={escalatedIds.includes(c.id) ? "ESCALATED" : c.status} /></td>
                                                    <td className="py-3 px-4 text-gray-400">{c.createdAt?.split("T")[0]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {sosComplaints.length > 0 && (
                                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
                                    <h3 className="font-bold text-red-700 mb-3">🚨 Active SOS in Station ({sosComplaints.length})</h3>
                                    {sosComplaints.slice(0, 2).map(c => (
                                        <div key={c.id} className="bg-white border border-red-200 rounded-lg p-3 mb-2 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-red-600">#{c.id}</span>
                                                <span className="ml-2 text-gray-700">{c.passengerName}</span>
                                                <p className="text-gray-500 text-xs truncate">{c.complaintText}</p>
                                            </div>
                                            <button onClick={() => setActiveSection("SOS Alerts")} className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700">Respond</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== COMPLAINTS ===== */}
                    {activeSection === "Complaints" && (
                        <div className="bg-white rounded-xl shadow">
                            <div className="p-5 border-b flex flex-wrap gap-3 items-center">
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                                    <option value="">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="ESCALATED">Escalated to RPF</option>
                                </select>
                                <span className="text-sm text-gray-500 ml-auto">{filteredComplaints.length} complaints — Station: {stationName}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-3 px-4 text-left">#ID</th>
                                            <th className="py-3 px-4 text-left">Passenger</th>
                                            <th className="py-3 px-4 text-left">Complaint</th>
                                            <th className="py-3 px-4 text-left">Assigned To</th>
                                            <th className="py-3 px-4 text-left">Status</th>
                                            <th className="py-3 px-4 text-left">Date</th>
                                            <th className="py-3 px-4 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="7" className="py-8 text-center text-gray-400">Loading...</td></tr>
                                        ) : filteredComplaints.length === 0 ? (
                                            <tr><td colSpan="7" className="py-8 text-center text-gray-400">No complaints found.</td></tr>
                                        ) : filteredComplaints.map(c => {
                                            const isEscalated = escalatedIds.includes(c.id);
                                            const displayStatus = isEscalated ? "ESCALATED" : c.status;
                                            return (
                                                <tr key={c.id} className={`border-b ${isEscalated ? "bg-purple-50" : "hover:bg-teal-50"}`}>
                                                    <td className="py-3 px-4 text-teal-600 font-semibold">#{c.id}</td>
                                                    <td className="py-3 px-4">{c.passengerName}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="max-w-xs truncate">{c.complaintText}</div>
                                                        {remarkMap[c.id] && <div className="text-xs text-gray-500 italic mt-1">📝 {remarkMap[c.id]}</div>}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-500 text-xs">{assignMap[c.id] || "—"}</td>
                                                    <td className="py-3 px-4"><StatusBadge status={displayStatus} /></td>
                                                    <td className="py-3 px-4 text-gray-400">{c.createdAt?.split("T")[0]}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            <button onClick={() => setActiveRemark(activeRemark === c.id ? null : c.id)}
                                                                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-200">Remark</button>
                                                            {!isEscalated && c.status !== "IN_PROGRESS" && (
                                                                <select defaultValue="" onChange={e => e.target.value && handleAssign(c.id, e.target.value)}
                                                                    className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">
                                                                    <option value="" disabled>Assign</option>
                                                                    {staff.filter(s => s.present).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                                </select>
                                                            )}
                                                            {!isEscalated && c.status !== "RESOLVED" && (
                                                                <button onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                                                                    className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600">Resolve</button>
                                                            )}
                                                            {!isEscalated && (
                                                                <button onClick={() => handleEscalate(c.id)}
                                                                    className="bg-purple-500 text-white text-xs px-2 py-1 rounded hover:bg-purple-600">↑ RPF</button>
                                                            )}
                                                        </div>
                                                        {activeRemark === c.id && (
                                                            <div className="mt-2 flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add remark..."
                                                                    className="border border-gray-300 rounded px-2 py-1 text-xs flex-1"
                                                                    onKeyDown={e => {
                                                                        if (e.key === "Enter") {
                                                                            setRemarkMap(prev => ({ ...prev, [c.id]: e.target.value }));
                                                                            setActiveRemark(null);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== SOS ALERTS ===== */}
                    {activeSection === "SOS Alerts" && (
                        <div>
                            {sosComplaints.length === 0 ? (
                                <div className="bg-white rounded-xl shadow p-12 text-center">
                                    <div className="text-5xl mb-4">✅</div>
                                    <p className="text-gray-500 text-lg">No active SOS alerts at {stationName}.</p>
                                </div>
                            ) : sosComplaints.map(c => (
                                <div key={c.id} className="bg-red-50 border-2 border-red-400 rounded-xl p-6 shadow mb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-red-600 font-bold text-lg animate-pulse">🚨 SOS #{c.id}</span>
                                                <StatusBadge status={escalatedIds.includes(c.id) ? "ESCALATED" : c.status} />
                                            </div>
                                            <p className="font-semibold text-gray-800 text-lg">{c.passengerName}</p>
                                            <p className="text-gray-600 mt-1">{c.complaintText}</p>
                                            <div className="mt-3 flex gap-4 text-sm text-gray-500">
                                                <span>📅 {c.createdAt?.split("T")[0]}</span>
                                                <span>🚉 {c.station || stationName}</span>
                                                <span>📞 Contact passenger immediately</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-6">
                                            <button onClick={() => handleStatusUpdate(c.id, "IN_PROGRESS")}
                                                className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 font-semibold">
                                                📞 Contact Passenger
                                            </button>
                                            <button onClick={() => handleEscalate(c.id)}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 font-semibold">
                                                ↑ Notify RPF
                                            </button>
                                            <button onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                                                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 font-semibold">
                                                ✅ Resolved
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ===== STAFF MANAGEMENT ===== */}
                    {activeSection === "Staff Management" && (
                        <div className="space-y-6">
                            {/* Add staff form */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Add Station Staff</h3>
                                {staffMsg && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-2 rounded mb-4 text-sm">{staffMsg}</div>}
                                <form onSubmit={handleAddStaff} className="grid md:grid-cols-3 gap-4">
                                    <input type="text" placeholder="Staff Name *" value={newStaff.name}
                                        onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" required />
                                    <input type="text" placeholder="Role / Designation *" value={newStaff.role}
                                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" required />
                                    <button type="submit" className="bg-teal-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-teal-700">+ Add Staff</button>
                                </form>
                            </div>
                            {/* Staff table */}
                            <div className="bg-white rounded-xl shadow overflow-hidden">
                                <div className="p-5 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Station Staff ({staff.length})</h3>
                                    <span className="text-sm text-gray-500">{staff.filter(s => s.present).length} present today</span>
                                </div>
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-3 px-4 text-left">Name</th>
                                            <th className="py-3 px-4 text-left">Designation</th>
                                            <th className="py-3 px-4 text-left">Assigned Cases</th>
                                            <th className="py-3 px-4 text-left">Attendance</th>
                                            <th className="py-3 px-4 text-left">Toggle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staff.map(s => (
                                            <tr key={s.id} className="border-b hover:bg-teal-50">
                                                <td className="py-3 px-4 font-semibold">👷 {s.name}</td>
                                                <td className="py-3 px-4 text-gray-500">{s.role}</td>
                                                <td className="py-3 px-4">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">{s.cases} cases</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${s.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {s.present ? "Present" : "Absent"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button onClick={() => setStaff(prev => prev.map(m => m.id === s.id ? { ...m, present: !m.present } : m))}
                                                        className={`text-xs px-3 py-1 rounded font-semibold ${s.present ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}>
                                                        {s.present ? "Mark Absent" : "Mark Present"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== REPORTS / ANNOUNCEMENTS ===== */}
                    {activeSection === "Reports" && (
                        <div className="space-y-6">
                            {/* Send announcement */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-gray-800 mb-4">📢 Send Station Announcement</h3>
                                <form onSubmit={handleSendAnnouncement} className="space-y-4">
                                    <div className="flex gap-4">
                                        {["Cleaning", "Maintenance", "Security", "Medical", "All Staff"].map(t => (
                                            <button type="button" key={t} onClick={() => setAnnouncement(a => ({ ...a, team: t }))}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${announcement.team === t ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-300 hover:border-teal-400"}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder={`Type announcement for ${announcement.team} team...`}
                                        value={announcement.message}
                                        onChange={e => setAnnouncement(a => ({ ...a, message: e.target.value }))}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                                        required
                                    />
                                    <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700">📤 Send Announcement</button>
                                </form>
                            </div>

                            {/* Announcement log */}
                            <div className="bg-white rounded-xl shadow overflow-hidden">
                                <div className="p-5 border-b">
                                    <h3 className="font-bold text-gray-800">Recent Announcements ({announcementLog.length})</h3>
                                </div>
                                {announcementLog.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">No announcements sent yet.</div>
                                ) : announcementLog.map(a => (
                                    <div key={a.id} className="border-b p-5 flex justify-between items-start hover:bg-teal-50">
                                        <div>
                                            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded mr-3">{a.team}</span>
                                            <span className="text-gray-700 text-sm">{a.message}</span>
                                        </div>
                                        <span className="text-gray-400 text-xs ml-4 whitespace-nowrap">{a.time}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Station summary report */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-gray-800 mb-4">📊 Station Summary Report</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {[
                                        { label: "Total Complaints", value: complaints.length, icon: "📋" },
                                        { label: "Resolved", value: complaints.filter(c => c.status === "RESOLVED").length, icon: "✅" },
                                        { label: "Escalated to RPF", value: escalatedIds.length, icon: "↑" },
                                        { label: "Pending", value: complaints.filter(c => c.status === "PENDING").length, icon: "⏳" },
                                        { label: "Staff Present", value: staff.filter(s => s.present).length, icon: "👷" },
                                        { label: "Resolution Rate", value: `${resolutionRate}%`, icon: "📈" },
                                    ].map(s => (
                                        <div key={s.label} className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                                            <span className="text-2xl">{s.icon}</span>
                                            <div>
                                                <div className="text-xl font-bold text-teal-700">{s.value}</div>
                                                <div className="text-gray-500 text-xs">{s.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StationMasterDashboard;
