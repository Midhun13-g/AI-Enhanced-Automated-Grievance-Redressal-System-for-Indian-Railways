import React, { useEffect, useState } from "react";
import API from "../api";

const EmergencyContacts = () => {
    const [contacts, setContacts] = useState([]);
    useEffect(() => {
        API.get("/emergency-contacts").then(res => setContacts(res.data));
    }, []);
    return (
        <div className="max-w-xl mx-auto py-8">
            <h2 className="text-2xl font-bold mb-4">Emergency Contacts</h2>
            <ul>
                {contacts.map((c, idx) => (
                    <li key={idx} className="mb-2">
                        <b>{c.type}:</b> <span className="font-mono">{c.number}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
export default EmergencyContacts;
