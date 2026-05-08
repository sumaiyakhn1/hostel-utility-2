import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

const Landing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLoginAndGo = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await hostelService.login();

      const token = data?.data?.token || data?.token;

      if (token) {
        localStorage.setItem("auth_token", token);
        navigate("/dashboard");
      } else {
        throw new Error("Token not found in response");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Login failed. Please check credentials or API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-3xl shadow-xl max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Hostel Portal</h1>
        <p className="text-gray-500 mb-8">
          Welcome to the student hostel management system. Click below to enter your dashboard.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleLoginAndGo}
          disabled={loading}
          className="w-full py-4 bg-red-700 hover:bg-red-800 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-red-700/20 active:scale-[0.98] transition-all disabled:bg-gray-400 disabled:shadow-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            "Go to Student Dashboard"
          )}
        </button>
      </div>
    </div>
  );
};

export default Landing;
