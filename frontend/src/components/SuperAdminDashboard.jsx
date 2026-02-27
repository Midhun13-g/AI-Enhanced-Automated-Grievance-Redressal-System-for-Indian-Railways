import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const SECTIONS = ["Overview", "All Users", "Create User", "Complaints"];
const ICONS = { Overview: "OV", "All Users": "US", "Create User": "+", Complaints: "CP" };

const ROLES = ["USER", "STATION_MASTER", "STATION_STAFF", "RPF_ADMIN", "SUPER_ADMIN"];
const ROLE_COLORS = {
    USER: "bg-blue-100 text-blue-700",
    STATION_MASTER: "bg-teal-100 text-teal-700",
    STATION_STAFF: "bg-indigo-100 text-indigo-700",
    RPF_ADMIN: "bg-orange-100 text-orange-700",
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    PASSENGER: "bg-gray-100 text-gray-700",
};

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);

    const [activeSection, setActiveSection] = useState("Overview");
    const [users, setUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    const [newUser, setNewUser] = useState({ email: "", password: "", role: "USER", stationName: "" });
    const [createMsg, setCreateMsg] = useState({ text: "", type: "" });
    const [updateMsg, setUpdateMsg] = useState({ text: "", type: "" });

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("");

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        Promise.all([
            API.get("/superadmin/users"),
            API.get("/superadmin/stats"),
            API.get("/complaints"),
        ])
            .then(([usersRes, statsRes, complaintsRes]) => {
                setUsers(usersRes.data);
                setStats(statsRes.data);
                setComplaints(complaintsRes.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const refreshUsers = () => {
        API.get("/superadmin/users").then(r => setUsers(r.data)).catch(() => { });
        API.get("/superadmin/stats").then(r => setStats(r.data)).catch(() => { });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/superadmin/users", newUser);
            const uniqueCode = res.data?.userCode ? ` (ID: ${res.data.userCode})` : "";
            setCreateMsg({ text: `Success: ${newUser.role} account created for ${newUser.email}${uniqueCode}`, type: "success" });
            setNewUser({ email: "", password: "", role: "USER", stationName: "" });
            refreshUsers();
        } catch (err) {
            setCreateMsg({ text: `Error: ${err.response?.data?.message || "Failed to create user"}`, type: "error" });
        }
        setTimeout(() => setCreateMsg({ text: "", type: "" }), 3500);
    };

    const handleUpdateUser = async (id) => {
        try {
            const payload = {
                role: (editData.role || "").toUpperCase(),
                stationName: editData.stationName ?? "",
            };
            const res = await API.patch(`/superadmin/users/${id}`, payload);
            setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...res.data } : u)));
            refreshUsers();
            setUpdateMsg({ text: "User updated successfully.", type: "success" });
            setEditingId(null);
        } catch (err) {
            setUpdateMsg({ text: err.response?.data?.message || "Failed to update user.", type: "error" });
        }
        setTimeout(() => setUpdateMsg({ text: "", type: "" }), 3000);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        try {
            await API.delete(`/superadmin/users/${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
            refreshUsers();
        } catch {
            // no-op
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchSearch = searchTerm
            ? (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.station || "").toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        const matchRole = filterRole ? u.role === filterRole : true;
        return matchSearch && matchRole;
    });

    const sortedComplaints = [...complaints].sort((a, b) => {
        const deptA = (a.department || a.category || "zzz").toLowerCase();
        const deptB = (b.department || b.category || "zzz").toLowerCase();
        if (deptA !== deptB) return deptA.localeCompare(deptB);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const resolutionRate = complaints.length
        ? Math.round((complaints.filter(c => c.status === "RESOLVED").length / complaints.length) * 100)
        : 0;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <aside className="w-64 bg-gradient-to-b from-purple-800 to-purple-950 text-white flex flex-col shadow-xl flex-shrink-0">
                <div className="p-5 border-b border-purple-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold">SA</div>
                        <div>
                            <div className="font-bold text-white text-sm">RailMadad</div>
                            <div className="text-purple-200 text-xs">Super Admin Console</div>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {SECTIONS.map((section) => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition text-sm font-medium ${activeSection === section ? "bg-yellow-400 text-purple-900 shadow font-bold" : "text-purple-100 hover:bg-purple-700 hover:text-white"}`}
                        >
                            <span className="text-xs font-bold">{ICONS[section]}</span>
                            {section}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-purple-700 space-y-2">
                    <div className="text-purple-200 text-xs text-center">SUPER ADMIN</div>
                    <div className="text-purple-300 text-xs text-center">Railway Board Level Access</div>
                    <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition mt-1">Logout</button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-purple-100">
                    <h1 className="text-xl font-bold text-gray-800">{ICONS[activeSection]} {activeSection}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-purple-600 font-medium">Railway Board</span>
                        <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center text-white text-sm font-bold">SA</div>
                    </div>
                </div>

                <div className="p-8">
                    {activeSection === "Overview" && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                {[
                                    { label: "Total Users", value: stats.totalUsers ?? users.length, color: "border-purple-500", text: "text-purple-600" },
                                    { label: "Station Masters", value: stats.stationMasters ?? 0, color: "border-teal-500", text: "text-teal-600" },
                                    { label: "Station Staff", value: stats.stationStaff ?? 0, color: "border-indigo-500", text: "text-indigo-600" },
                                    { label: "RPF Admins", value: stats.rpfAdmins ?? 0, color: "border-orange-500", text: "text-orange-600" },
                                    { label: "Passengers", value: stats.passengers ?? 0, color: "border-blue-500", text: "text-blue-600" },
                                    { label: "Total Complaints", value: complaints.length, color: "border-red-500", text: "text-red-600" },
                                ].map((s) => (
                                    <div key={s.label} className={`bg-white rounded-xl shadow p-5 border-l-4 ${s.color}`}>
                                        <div className={`text-3xl font-bold ${s.text}`}>{loading ? "-" : s.value}</div>
                                        <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-700">System-Wide Resolution Rate</span>
                                    <span className="font-bold text-green-600 text-lg">{resolutionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div className="bg-purple-500 h-4 rounded-full transition-all" style={{ width: `${resolutionRate}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "All Users" && (
                        <div className="bg-white rounded-xl shadow">
                            <div className="p-5 border-b flex flex-wrap gap-3 items-center">
                                {updateMsg.text && (
                                    <div className={`w-full px-3 py-2 rounded text-sm ${updateMsg.type === "success" ? "bg-green-50 border border-green-300 text-green-700" : "bg-red-50 border border-red-300 text-red-700"}`}>
                                        {updateMsg.text}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder="Search by email / station..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-64"
                                />
                                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                                    <option value="">All Roles</option>
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <span className="text-sm text-gray-500 ml-auto">{filteredUsers.length} users</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-3 px-4 text-left">#ID</th>
                                            <th className="py-3 px-4 text-left">Unique No</th>
                                            <th className="py-3 px-4 text-left">Email</th>
                                            <th className="py-3 px-4 text-left">Role</th>
                                            <th className="py-3 px-4 text-left">Station</th>
                                            <th className="py-3 px-4 text-left">Created</th>
                                            <th className="py-3 px-4 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="7" className="py-8 text-center text-gray-400">Loading...</td></tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr><td colSpan="7" className="py-8 text-center text-gray-400">No users found.</td></tr>
                                        ) : filteredUsers.map((u) => (
                                            <tr key={u.id} className="border-b hover:bg-purple-50">
                                                <td className="py-3 px-4 text-purple-600 font-semibold">#{u.id}</td>
                                                <td className="py-3 px-4 text-gray-700 font-mono">{u.userCode || `USR-${String(u.id).padStart(6, "0")}`}</td>
                                                <td className="py-3 px-4">{u.username}</td>
                                                <td className="py-3 px-4">
                                                    {editingId === u.id ? (
                                                        <select value={editData.role || u.role}
                                                            onChange={e => setEditData(prev => ({ ...prev, role: e.target.value }))}
                                                            className="border rounded px-2 py-1 text-sm">
                                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    ) : <span className={`px-2 py-1 rounded text-xs font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}`}>{u.role}</span>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {editingId === u.id ? (
                                                        <input value={editData.stationName ?? (u.station || "")}
                                                            onChange={e => setEditData(prev => ({ ...prev, stationName: e.target.value }))}
                                                            className="border rounded px-2 py-1 text-sm w-full" placeholder="Station name" />
                                                    ) : (u.station || "-")}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400">{u.createdAt?.split("T")[0] || "-"}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        {editingId === u.id ? (
                                                            <>
                                                                <button onClick={() => handleUpdateUser(u.id)} className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600">Save</button>
                                                                <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded hover:bg-gray-300">Cancel</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => { setEditingId(u.id); setEditData({ role: u.role, stationName: u.station || "" }); }} className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-200">Edit</button>
                                                                <button onClick={() => handleDeleteUser(u.id)} className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded hover:bg-red-200">Delete</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === "Create User" && (
                        <div className="max-w-lg mx-auto">
                            <div className="bg-white rounded-xl shadow p-8">
                                <h3 className="font-bold text-gray-800 text-xl mb-6">Create New User Account</h3>
                                {createMsg.text && (
                                    <div className={`px-4 py-3 rounded-lg mb-5 text-sm font-medium ${createMsg.type === "success" ? "bg-green-50 border border-green-300 text-green-700" : "bg-red-50 border border-red-300 text-red-700"}`}>
                                        {createMsg.text}
                                    </div>
                                )}
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <input type="email" required placeholder="user@railways.in" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                    <input type="password" required minLength={6} placeholder="Min 6 characters" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                    <select required value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    {(newUser.role === "STATION_MASTER" || newUser.role === "STATION_STAFF") && (
                                        <input type="text" placeholder="e.g. Chennai Central" value={newUser.stationName} onChange={e => setNewUser({ ...newUser, stationName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                    )}
                                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-sm transition">Create User Account</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeSection === "Complaints" && (
                        <div className="bg-white rounded-xl shadow">
                            <div className="p-5 border-b flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">All System Complaints</h3>
                                <div className="flex gap-3 text-sm">
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">Pending: {complaints.filter(c => c.status === "PENDING").length}</span>
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">In Progress: {complaints.filter(c => c.status === "IN_PROGRESS").length}</span>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">Resolved: {complaints.filter(c => c.status === "RESOLVED").length}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-3 px-4 text-left">#ID</th>
                                            <th className="py-3 px-4 text-left">Passenger</th>
                                            <th className="py-3 px-4 text-left">Complaint</th>
                                            <th className="py-3 px-4 text-left">Department</th>
                                            <th className="py-3 px-4 text-left">Station</th>
                                            <th className="py-3 px-4 text-left">Assigned To</th>
                                            <th className="py-3 px-4 text-left">Status</th>
                                            <th className="py-3 px-4 text-left">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="8" className="py-8 text-center text-gray-400">Loading...</td></tr>
                                        ) : sortedComplaints.length === 0 ? (
                                            <tr><td colSpan="8" className="py-8 text-center text-gray-400">No complaints found.</td></tr>
                                        ) : sortedComplaints.map(c => (
                                            <tr key={c.id} className="border-b hover:bg-purple-50">
                                                <td className="py-3 px-4 text-purple-600 font-semibold">#{c.id}</td>
                                                <td className="py-3 px-4">{c.passengerName}</td>
                                                <td className="py-3 px-4 max-w-xs truncate">{c.complaintText}</td>
                                                <td className="py-3 px-4 text-gray-600">{c.department || c.category || "-"}</td>
                                                <td className="py-3 px-4 text-gray-400">{c.station || "-"}</td>
                                                <td className="py-3 px-4 text-gray-400">{c.assignedTo || "-"}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${c.status === "RESOLVED" ? "bg-green-100 text-green-700" : c.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{c.status}</span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400">{c.createdAt?.split("T")[0]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
