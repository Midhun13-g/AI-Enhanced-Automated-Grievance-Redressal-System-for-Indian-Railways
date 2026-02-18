import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = ({ onLogout }) => {
    const context = useContext(AuthContext);
    const user = context?.user;

    return (
        <nav className="bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-xl">🚂</span>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-xl">RailMadad</h1>
                            <p className="text-orange-100 text-xs">For Inquiry, Assistance & Grievance Redressal</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-white text-sm">Welcome, {user?.username || "User"}</span>
                        <button
                            onClick={onLogout}
                            className="bg-white text-orange-600 px-4 py-2 rounded-md hover:bg-orange-50 font-semibold text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
