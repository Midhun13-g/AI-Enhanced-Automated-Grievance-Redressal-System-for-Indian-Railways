import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import Navbar from "./Navbar";

const Home = () => {
    const navigate = useNavigate();
    const context = useContext(AuthContext);
    const user = context?.user;
    const logoutFn = context?.logout;
    const [helpline, setHelpline] = useState({ number: "139", description: "for Security/Medical Assistance" });

    const handleLogout = () => {
        logoutFn();
        navigate("/login");
    };

    useEffect(() => {
        API.get("/helpline")
            .then((res) => setHelpline(res.data))
            .catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onLogout={handleLogout} />
            {/* Helpline Number Callout */}
            <div className="w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 flex items-center justify-center">
                <span className="font-bold text-lg mr-2">Helpline:</span>
                <span className="font-mono text-xl">{helpline.number}</span>
                <span className="ml-2">{helpline.description}</span>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Welcome to RailMadad, {user?.username}!
                    </h1>
                    <p className="text-xl text-gray-600">
                        Your one-stop solution for railway grievance redressal
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Link
                        to="/complaints/new"
                        className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition border-l-4 border-orange-600"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-3xl">✍️</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Lodge Complaint</h2>
                        </div>
                        <p className="text-gray-600">
                            Submit a new grievance or complaint about railway services
                        </p>
                    </Link>

                    <Link
                        to="/complaints"
                        className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition border-l-4 border-blue-600"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-3xl">📋</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">View Complaints</h2>
                        </div>
                        <p className="text-gray-600">
                            Track and manage all your submitted complaints
                        </p>
                    </Link>
                </div>

                <div className="mt-12 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg shadow-lg p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Quick Stats</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold">24/7</div>
                            <div className="text-orange-100">Support Available</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold">Fast</div>
                            <div className="text-orange-100">Response Time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold">Secure</div>
                            <div className="text-orange-100">Data Protection</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
