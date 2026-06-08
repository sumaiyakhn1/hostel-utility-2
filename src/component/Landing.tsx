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
  const [selectedSchoolId, setSelectedSchoolId] = useState(SCHOOLS[0].id);
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

        const selectedSchool = SCHOOLS.find(s => s.id === selectedSchoolId);
        let regNo = passedRegNo || inputRegNo;

        if (selectedSchool && regNo) {
          try {
            // Verify if student exists in the selected entity
            const studentData = await hostelService.getStudentDetails({
              id: "689441d9d2b728001069ebe7", // Hardcoded ID expected by backend
              entity: selectedSchool.entityId,
              session: selectedSchool.session,
              regNo: regNo,
            });

            // If no valid data is returned, throw an error
            if (!studentData || !studentData.name) {
              throw new Error("Student not found in the selected college.");
            }

            // Save valid school details to localStorage
            localStorage.setItem("student_entity_id", selectedSchool.entityId);
            localStorage.setItem("student_session", selectedSchool.session);
            localStorage.setItem("student_college_name", selectedSchool.name);
            
            navigate(`/dashboard/${regNo}`);
          } catch (err: any) {
            console.error("Student verification failed:", err);
            if (err.response?.status === 409) {
              setError("This registration number does not belong to the selected college. Please select the correct college.");
            } else {
              setError("Invalid registration number for the selected college.");
            }
            setLoading(false);
            return; // Stop navigation
          }
        } else if (!regNo) {
           setError("Registration number is missing.");
           setLoading(false);
           return;
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

        <div className="mb-4 relative">
          <label className="block text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2.5 ml-1">
            Select School / College
          </label>
          <div className="relative">
            <button
              onClick={() => {
                // Using a simple blur to close approach by rendering the dropdown conditionally
                const dd = document.getElementById("college-dropdown");
                if (dd) dd.classList.toggle("hidden");
              }}
              onBlur={() => {
                setTimeout(() => {
                  const dd = document.getElementById("college-dropdown");
                  if (dd && !dd.matches(':hover')) dd.classList.add("hidden");
                }, 150);
              }}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-red-700/5 focus:border-red-700/30 transition-all font-bold text-gray-800 flex justify-between items-center text-left"
            >
              <span className="truncate pr-4">
                {SCHOOLS.find((s) => s.id === selectedSchoolId)?.name}
              </span>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div 
              id="college-dropdown" 
              className="hidden absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden"
            >
              {SCHOOLS.map((school) => (
                <div
                  key={school.id}
                  onClick={() => {
                    setSelectedSchoolId(school.id);
                    document.getElementById("college-dropdown")?.classList.add("hidden");
                  }}
                  className={`px-5 py-4 cursor-pointer text-left transition-colors border-b border-gray-50 last:border-0 hover:bg-red-50
                    ${selectedSchoolId === school.id ? "bg-red-50/50" : ""}`}
                >
                  <p className={`text-sm font-bold leading-relaxed ${selectedSchoolId === school.id ? "text-red-700" : "text-gray-700"}`}>
                    {school.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

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
