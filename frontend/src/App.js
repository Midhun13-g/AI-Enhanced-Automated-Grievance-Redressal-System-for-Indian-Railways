import React from "react";
import Sidebar from "./components/Sidebar";
import ComplaintForm from "./components/ComplaintForm";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:px-12">
        <div className="w-full max-w-4xl">
          <Dashboard />
          <div id="grievance" className="mt-10">
            <ComplaintForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
