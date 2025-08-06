import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/authContext";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./components/layouts/MainLayout";
import GoogleLogin from "./pages/GoogleLogin";

const App: React.FC = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected route */}
        <Route
          path="/"
          element={token ? (<MainLayout><Dashboard/></MainLayout>):(<Navigate to="/login"/>)}
        />
        <Route
          path="/folder/:id"
          element={token ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/login" />}
        />
        <Route path="/google-callback" element={<GoogleLogin />} />
        <Route path= "/login-google" element={<GoogleLogin/>} />
      </Routes>
    </div>
  );
};

export default App;
 