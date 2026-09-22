import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n";
import { AuthProvider } from "@/auth";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import AccountPage from "@/pages/AccountPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import AuthCallback from "@/components/AuthCallback";

function AppRouter() {
  const location = useLocation();
  // Detect OAuth session_id synchronously during render (prevents race conditions)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="App">
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
