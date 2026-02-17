import React from "react";

const Sidebar = () => (
    <aside className="bg-gradient-to-b from-[#7b1f2b] to-[#f57c00] text-white w-64 min-h-screen flex flex-col shadow-xl">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-orange-200">
            <img src="/logo192.png" alt="Railway Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-wide">Railway Grievance</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            <a href="#grievance" className="block py-3 px-4 rounded-lg hover:bg-orange-600 transition font-medium">
                Lodge Grievance
            </a>
            <a href="#track" className="block py-3 px-4 rounded-lg hover:bg-orange-600 transition font-medium">
                Track Concern
            </a>
            <a href="#suggestions" className="block py-3 px-4 rounded-lg hover:bg-orange-600 transition font-medium">
                Suggestions
            </a>
            <a href="#appreciation" className="block py-3 px-4 rounded-lg hover:bg-orange-600 transition font-medium">
                Appreciation / Rail Anubhav
            </a>
        </nav>
        <div className="px-6 py-4 border-t border-orange-200 text-xs text-orange-100">
            &copy; {new Date().getFullYear()} Railway Grievance Portal
        </div>
    </aside>
);

export default Sidebar;
