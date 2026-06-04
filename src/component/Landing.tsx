import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

const Landing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputRegNo, setInputRegNo] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let regNo = urlParams.get("regNo");
    
    if (regNo && regNo.includes("regNo=")) {
      regNo = regNo.split("regNo=").pop() || "";
    } else if (regNo && regNo.startsWith("?")) {
      regNo = regNo.substring(1);
    }

    if (regNo) {
      setInputRegNo(regNo);
    }
  }, []);

  const handleLoginAndGo = async (passedRegNo?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await hostelService.login();
      const token = data?.data?.token || data?.token;

      if (token) {
        try {
          localStorage.setItem("auth_token", token);
        } catch (e) {
          console.warn("Could not save token to localStorage", e);
        }
        
        // Use passed regNo or state or URL
        let regNo = passedRegNo || inputRegNo;

        if (regNo) {
          navigate(`/dashboard/${regNo}`);
        } else {
          navigate("/dashboard/unknown"); 
        }
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

        <div className="mb-6">
          <label className="block text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">
            Student Registration No
          </label>
          <input
            type="text"
            value={inputRegNo}
            readOnly
            placeholder="e.g. 120198000000"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-red-700/5 focus:border-red-700/30 transition-all font-bold text-gray-800 placeholder:text-gray-300"
          />
        </div>

        <button
          onClick={() => handleLoginAndGo()}
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
