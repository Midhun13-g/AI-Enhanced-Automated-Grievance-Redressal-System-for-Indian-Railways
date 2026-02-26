import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const SECTIONS = ["Dashboard", "Complaints", "SOS Alerts", "Officers", "Analytics"];
const ICONS = { Dashboard: "🏠", Complaints: "📋", "SOS Alerts": "🚨", Officers: "👮", Analytics: "📊" };

const StatusBadge = ({ status }) => {
    const map = { RESOLVED: "bg-green-100 text-green-700", IN_PROGRESS: "bg-yellow-100 text-yellow-700", PENDING: "bg-red-100 text-red-700" };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState({});
    const [topIssues, setTopIssues] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState("Dashboard");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [officers, setOfficers] = useState([]);
    const [newOfficer, setNewOfficer] = useState({ name: "", badge: "", email: "" });
    const [officerMsg, setOfficerMsg] = useState("");

    const handleLogout = () => { logout(); navigate("/login"); };

    useEffect(() => {
        API.get("/departments/analytics/by-department").then(res => setAnalytics(res.data)).catch(() => { });
        API.get("/departments/analytics/top-issues").then(res => setTopIssues(res.data)).catch(() => { });
        API.get("/users?role=RPF_ADMIN").then(res => setOfficers(res.data)).catch(() => { });
        API.get("/complaints")
            .then(res => { setComplaints(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleStatusUpdate = (id, newStatus) => {
        API.patch(`/complaints/${id}/status`, { newStatus })
            .then(() => setComplaints(c => c.map(comp => comp.id === id ? { ...comp, status: newStatus } : comp)))
            .catch(() => { });
    };

    const filteredComplaints = complaints.filter(c => {
        const matchStatus = filterStatus ? c.status === filterStatus : true;
        const matchDept = filterDept ? (c.department || "").toLowerCase().includes(filterDept.toLowerCase()) : true;
        return matchStatus && matchDept;
    });

    const sosComplaints = complaints.filter(c =>
        c.status !== "RESOLVED" && (
            (c.complaintText || "").toLowerCase().includes("sos") ||
            (c.complaintText || "").toLowerCase().includes("emergency") ||
            (c.complaintText || "").toLowerCase().includes("help") ||
            c.urgencyScore >= 8
        )
    );

    const handleAddOfficer = (e) => {
        e.preventDefault();
        if (!newOfficer.name || !newOfficer.badge) return;
        setOfficers([...officers, { id: Date.now(), username: newOfficer.email || newOfficer.name, station: "", role: "RPF_ADMIN" }]);
        setNewOfficer({ name: "", badge: "", email: "" });
        setOfficerMsg("Officer added locally. Create user in Super Admin for persistent account.");
        setTimeout(() => setOfficerMsg(""), 3000);
    };

    const today = new Date().toISOString().split("T")[0];
    const complaintsToday = complaints.filter(c => c.createdAt?.startsWith(today)).length;
    const resolutionRate = complaints.length
        ? Math.round((complaints.filter(c => c.status === "RESOLVED").length / complaints.length) * 100)
        : 0;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col shadow-xl flex-shrink-0">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-lg">🚂</div>
                        <div>
                            <div className="font-bold text-white text-sm">RailMadad</div>
                            <div className="text-slate-400 text-xs">RPF Admin Panel</div>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {SECTIONS.map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition text-sm font-medium ${activeSection === section ? "bg-orange-500 text-white shadow" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                        >
                            <span className="text-lg">{ICONS[section]}</span>
                            {section}
                            {section === "SOS Alerts" && sosComplaints.length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{sosComplaints.length}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">🚪 Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-gray-800">{ICONS[activeSection]} {activeSection}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">👮 RPF Admin</span>
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
                    </div>
                </div>

                <div className="p-8">
                    {/* ===== DASHBOARD ===== */}
                    {activeSection === "Dashboard" && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                {[
                                    { label: "Total Complaints", value: complaints.length, color: "border-blue-500", text: "text-blue-600" },
                                    { label: "Pending", value: complaints.filter(c => c.status === "PENDING").length, color: "border-red-500", text: "text-red-600" },
                                    { label: "Resolved", value: complaints.filter(c => c.status === "RESOLVED").length, color: "border-green-500", text: "text-green-600" },
                                    { label: "Active SOS", value: sosComplaints.length, color: "border-orange-500", text: "text-orange-600" },
                                    { label: "Today", value: complaintsToday, color: "border-purple-500", text: "text-purple-600" },
                                ].map(s => (
                                    <div key={s.label} className={`bg-white rounded-xl shadow p-5 border-l-4 ${s.color}`}>
                                        <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
                                        <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white rounded-xl shadow p-6 mb-8">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-700">Overall Resolution Rate</span>
                                    <span className="font-bold text-green-600 text-lg">{resolutionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${resolutionRate}%` }} />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow">
                                <div className="p-5 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Recent Complaints</h3>
                                    <button onClick={() => setActiveSection("Complaints")} className="text-orange-500 text-sm hover:underline">View All →</button>
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
                                                <tr key={c.id} className="border-b hover:bg-orange-50">
                                                    <td className="py-3 px-4 text-orange-600 font-semibold">#{c.id}</td>
                                                    <td className="py-3 px-4">{c.passengerName}</td>
                                                    <td className="py-3 px-4 max-w-xs truncate">{c.complaintText}</td>
                                                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                                                    <td className="py-3 px-4 text-gray-400">{c.createdAt?.split("T")[0]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {sosComplaints.length > 0 && (
                                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
                                    <h3 className="font-bold text-red-700 mb-3">🚨 Active SOS Alerts ({sosComplaints.length})</h3>
                                    {sosComplaints.slice(0, 2).map(c => (
                                        <div key={c.id} className="bg-white border border-red-200 rounded-lg p-3 mb-2 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-red-600">#{c.id}</span>
                                                <span className="ml-2 text-gray-700">{c.passengerName}</span>
                                                <p className="text-gray-500 text-xs truncate">{c.complaintText}</p>
                                            </div>
                                            <button onClick={() => setActiveSection("SOS Alerts")} className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700">View</button>
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
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                                    <option value="">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                                <input type="text" placeholder="Filter by department..." value={filterDept}
                                    onChange={e => setFilterDept(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                <span className="text-sm text-gray-500 ml-auto">{filteredComplaints.length} results</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-3 px-4 text-left">#ID</th>
                                            <th className="py-3 px-4 text-left">Passenger</th>
                                            <th className="py-3 px-4 text-left">Complaint</th>
                                            <th className="py-3 px-4 text-left">Dept</th>
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
                                        ) : filteredComplaints.map(c => (
                                            <tr key={c.id} className="border-b hover:bg-orange-50">
                                                <td className="py-3 px-4 text-orange-600 font-semibold">#{c.id}</td>
                                                <td className="py-3 px-4">{c.passengerName}</td>
                                                <td className="py-3 px-4 max-w-xs truncate">{c.complaintText}</td>
                                                <td className="py-3 px-4 text-gray-400">{c.department || "—"}</td>
                                                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                                                <td className="py-3 px-4 text-gray-400">{c.createdAt?.split("T")[0]}</td>
                                                <td className="py-3 px-4 flex gap-2">
                                                    {c.status !== "IN_PROGRESS" && (
                                                        <button onClick={() => handleStatusUpdate(c.id, "IN_PROGRESS")}
                                                            className="bg-yellow-500 text-white text-xs px-2 py-1 rounded hover:bg-yellow-600">Progress</button>
                                                    )}
                                                    {c.status !== "RESOLVED" && (
                                                        <button onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                                                            className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600">Resolve</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
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
                                    <p className="text-gray-500 text-lg">No active SOS alerts. All clear!</p>
                                </div>
                            ) : sosComplaints.map(c => (
                                <div key={c.id} className="bg-red-50 border-2 border-red-400 rounded-xl p-6 shadow mb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-red-600 font-bold text-lg">🚨 SOS #{c.id}</span>
                                                <StatusBadge status={c.status} />
                                            </div>
                                            <p className="font-semibold text-gray-800">{c.passengerName}</p>
                                            <p className="text-gray-600 mt-1">{c.complaintText}</p>
                                            <p className="text-gray-400 text-sm mt-2">📅 {c.createdAt?.split("T")[0]} | 🏢 {c.department || "Unknown"} | 🚉 {c.station || "Unknown"}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                            <button onClick={() => handleStatusUpdate(c.id, "IN_PROGRESS")}
                                                className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 font-semibold">Assign Officer</button>
                                            <button onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                                                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 font-semibold">Mark Resolved</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ===== OFFICERS ===== */}
                    {activeSection === "Officers" && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Add New RPF Officer</h3>
                                {officerMsg && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-2 rounded mb-4 text-sm">{officerMsg}</div>}
                                <form onSubmit={handleAddOfficer} className="grid md:grid-cols-4 gap-4">
                                    <input type="text" placeholder="Officer Name *" value={newOfficer.name}
                                        onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                                    <input type="text" placeholder="Badge No *" value={newOfficer.badge}
                                        onChange={e => setNewOfficer({ ...newOfficer, badge: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                                    <input type="email" placeholder="Email" value={newOfficer.email}
                                        onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                    <button type="submit" className="bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-orange-600">+ Add Officer</button>
                                </form>
                            </div>
                            <div className="bg-white rounded-xl shadow overflow-hidden">
                                <div className="p-5 border-b"><h3 className="font-bold text-gray-800">RPF Officers ({officers.length})</h3></div>
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-3 px-4 text-left">Name</th>
                                            <th className="py-3 px-4 text-left">Badge</th>
                                            <th className="py-3 px-4 text-left">Email</th>
                                            <th className="py-3 px-4 text-left">Active Cases</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {officers.map(o => (
                                            <tr key={o.id} className="border-b hover:bg-orange-50">
                                                <td className="py-3 px-4 font-semibold">👮 {o.name}</td>
                                                <td className="py-3 px-4 text-gray-500">{o.badge}</td>
                                                <td className="py-3 px-4 text-gray-500">{o.email || "—"}</td>
                                                <td className="py-3 px-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">{o.cases} cases</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== ANALYTICS ===== */}
                    {activeSection === "Analytics" && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                                    <div className="text-3xl font-bold text-green-600">{resolutionRate}%</div>
                                    <div className="text-gray-500 mt-1">Resolution Rate</div>
                                </div>
                                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                                    <div className="text-3xl font-bold text-blue-600">{complaints.filter(c => c.status === "IN_PROGRESS").length}</div>
                                    <div className="text-gray-500 mt-1">In Progress</div>
                                </div>
                                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                                    <div className="text-3xl font-bold text-red-600">{sosComplaints.length}</div>
                                    <div className="text-gray-500 mt-1">SOS / Emergency</div>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl shadow p-6">
                                    <h3 className="font-bold text-gray-800 mb-4">Complaints by Department</h3>
                                    {Object.keys(analytics).length === 0 ? (
                                        <p className="text-gray-400 text-sm">No department data yet.</p>
                                    ) : Object.entries(analytics).map(([dept, count]) => {
                                        const pct = complaints.length ? Math.round((count / complaints.length) * 100) : 0;
                                        return (
                                            <div key={dept} className="mb-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700">{dept || "Unassigned"}</span>
                                                    <span className="font-bold">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="bg-white rounded-xl shadow p-6">
                                    <h3 className="font-bold text-gray-800 mb-4">Top Complaint Issues</h3>
                                    {topIssues.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No top issues yet.</p>
                                    ) : (
                                        <ol className="space-y-2">
                                            {topIssues.map((issue, idx) => (
                                                <li key={idx} className="flex items-center gap-3 text-sm">
                                                    <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                                    <span className="text-gray-700 truncate">{issue}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Status Breakdown</h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    {[
                                        { label: "Pending", count: complaints.filter(c => c.status === "PENDING").length, color: "bg-red-500" },
                                        { label: "In Progress", count: complaints.filter(c => c.status === "IN_PROGRESS").length, color: "bg-yellow-500" },
                                        { label: "Resolved", count: complaints.filter(c => c.status === "RESOLVED").length, color: "bg-green-500" },
                                    ].map(s => (
                                        <div key={s.label} className="p-4 rounded-xl bg-gray-50">
                                            <div className={`w-12 h-12 ${s.color} rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg mb-2`}>{s.count}</div>
                                            <div className="text-gray-600 text-sm font-medium">{s.label}</div>
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

export default AdminDashboard;

