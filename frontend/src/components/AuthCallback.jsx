import React, { useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const sessionId = new URLSearchParams(location.hash.replace(/^#/, "")).get("session_id");
    const exchange = async () => {
      try {
        const res = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        setUser(res.data);
        navigate("/account", { replace: true, state: { user: res.data } });
      } catch {
        navigate("/login", { replace: true });
      }
    };
    exchange();
  }, [location, navigate, setUser]);

  return (
    <div data-testid="auth-callback" className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amberdark border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
