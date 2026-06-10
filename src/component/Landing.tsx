import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

const SCHOOLS = [
  {
    id: "JMIETI",
    name: "JMIETI (Jai Parkash Mukand Lal Innovative Eng & Tech)",
    entityId: "5ea04b2f774faa5d67505ab2",
    session: "2025-26 Even"
  },
  {
    id: "JMIT",
    name: "JMIT (Seth Jai Parkash Mukand Lal Inst of Eng & Tech)",
    entityId: "5e74b933c14d052673463fd3",
    session: "2025-26 Even"
  }
];

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
          console.warn("Could not save to localStorage", e);
        }

        let regNo = passedRegNo || inputRegNo;

        if (regNo) {
          let foundStudent = false;

          for (const school of SCHOOLS) {
            try {
              // Verify if student exists in the current entity
              const studentData = await hostelService.getStudentDetails({
                id: "689441d9d2b728001069ebe7", // Hardcoded ID expected by backend
                entity: school.entityId,
                session: school.session,
                regNo: regNo,
              });

              // If valid data is returned, save and navigate
              if (studentData && studentData.name) {
                localStorage.setItem("student_entity_id", school.entityId);
                localStorage.setItem("student_session", school.session);
                localStorage.setItem("student_college_name", school.name);
                
                foundStudent = true;
                navigate(`/dashboard/${regNo}`);
                return; // Stop iteration and navigation
              }
            } catch (err: any) {
              console.error(`Student verification failed for ${school.name}:`, err);
              // Ignore error and continue to the next school
            }
          }

          // If loop finishes and student wasn't found in any school
          if (!foundStudent) {
            setError("Could not find this registration number in any available college.");
            setLoading(false);
            return;
          }
        } else {
           setError("Registration number is missing.");
           setLoading(false);
           return;
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
