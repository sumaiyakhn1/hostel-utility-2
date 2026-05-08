import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

interface StudentRecord {
  _id: string;
  regNumber: string;
  name: string;
  applyDate: string;
  session: string;
  wing: string;
  roomNo: string;
  bedNo: string;
  roomType: string;
  paymentFreq: string;
  startDate: string;
  endDate: string;
  remark: string;
  rejectRemark: string;
  status: string;
}

interface MasterData {
  hostel: string[];
  roomType: string[];
  paymentFrequency: string[];
}

export default function WardenDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null,
  );
  const [selectedErpStudent, setSelectedErpStudent] = useState<any>(null);
  const [masterData, setMasterData] = useState<MasterData | null>(null);

  const [approveStartDate, setApproveStartDate] = useState("");
  const [approveEndDate, setApproveEndDate] = useState("");
  const [approvePaymentFreq, setApprovePaymentFreq] = useState("");

  const [rejectRemark, setRejectRemark] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showErpConfirm, setShowErpConfirm] = useState(false);
  const [erpPushData, setErpPushData] = useState<StudentRecord | null>(null);


  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  const ENTITY_ID = "5ea04b2f774faa5d67505ab2";

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const data = await hostelService.getAllSavedStudents();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/warden/login");
    } else {
      fetchAllStudents();
    }
  }, [navigate]);

  if (!localStorage.getItem("auth_token")) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("warden_mobile");
    navigate("/warden/login");
  };

  const fetchMasterData = async () => {
    try {
      const data = await hostelService.getHostelMaster(ENTITY_ID);
      if (data) setMasterData(data);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  const fetchRoomsForEdit = async (
    wing: string,
    type: string,
    session: string,
  ) => {
    if (!wing || !type || !session) return;
    try {
      const data = await hostelService.getHostelRooms({
        entity: ENTITY_ID,
        session,
        hostel: wing,
        roomType: type,
      });
      const rooms = Array.isArray(data) ? data : data.data || [];
      setAvailableRooms(rooms);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const handleEditClick = (student: StudentRecord) => {
    setEditingId(student._id);
    setEditForm({ ...student });
    fetchMasterData();
    fetchRoomsForEdit(student.wing, student.roomType, student.session);
  };

  useEffect(() => {
    if (editingId && editForm) {
      fetchRoomsForEdit(editForm.wing, editForm.roomType, editForm.session);
    }
  }, [editForm?.wing, editForm?.roomType]);

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setProcessingId(editForm._id);
    try {
      await hostelService.updateStudentInDB(editForm.regNumber, editForm);
      await fetchAllStudents();
      setEditingId(null);
    } catch {
      alert("Failed to update record.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignToERP = async (student: StudentRecord) => {
    if (!student.startDate || !student.endDate) {
      alert("Cannot assign to ERP: Start Date and End Date must be set first. Please approve the application properly.");
      return;
    }

    setErpPushData(student);
    setShowErpConfirm(true);
  };

  const executeERPPush = async () => {
    if (!erpPushData) return;
    const student = erpPushData;
    setShowErpConfirm(false);
    setProcessingId(student._id);

    try {
      const erpStudent = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: ENTITY_ID,
        session: student.session,
        regNo: student.regNumber,
      });
      if (!erpStudent || !erpStudent._id) {
        alert("Student not found in ERP system.");
        return;
      }
      const wings = await hostelService.getHostelRooms({
        entity: ENTITY_ID,
        session: student.session,
        hostel: student.wing,
        roomType: student.roomType,
      });
      const rooms = Array.isArray(wings) ? wings : wings.data || [];
      const selectedRoom = rooms.find(
        (r: any) => r.roomName === student.roomNo,
      );
      if (!selectedRoom) {
        alert("Selected room is not valid in the ERP system.");
        return;
      }
      const payload = {
        role: [],
        qualifications: [],
        workExperience: [],
        hostel: student.wing,
        hostelRoomType: student.roomType,
        beds: selectedRoom.beds || [],
        entity: ENTITY_ID,
        hostelEndDate: new Date(student.endDate).getTime(),
        hostelPaymentFrequency: student.paymentFreq,
        hostelRoomBedName: student.bedNo,
        hostelRoomId: selectedRoom._id,
        hostelRoomName: student.roomNo,
        hostelStartDate: new Date(student.startDate).getTime(),
        roomCharges: selectedRoom.roomCharges || [],
        session: student.session,
        skipInstallments: [],
        studentId: erpStudent._id,
      };
      const res = await hostelService.assignHostelRoom(payload);
      console.log("ERP Response:", res);

      await hostelService.updateStudentInDB(student.regNumber, {
        status: "assigned",
      });
      alert("ERP Allocation successful.");
      await fetchAllStudents();
      setErpPushData(null);
      closeModal();
    } catch (error) {
      console.error("Assignment Error:", error);
      alert("Application could not be pushed to ERP. Check console for details.");
    } finally {
      setProcessingId(null);
    }
  };


  const handleStudentClick = async (student: StudentRecord) => {
    setSelectedStudent(student);
    setSelectedErpStudent(null);
    setApproveStartDate(student.startDate || "");
    setApproveEndDate(student.endDate || "");
    setApprovePaymentFreq(student.paymentFreq || "");
    setRejectRemark("");
    setShowRejectBox(false);
    if (!masterData) fetchMasterData();

    try {
      const erpData = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: ENTITY_ID,
        session: student.session,
        regNo: student.regNumber,
      });
      if (erpData) setSelectedErpStudent(erpData);
    } catch (err) {
      console.error("Error fetching ERP student details:", err);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setShowRejectBox(false);
    setRejectRemark("");
    setIsModalEditing(false);
  };

  const getFilteredBeds = (roomName: string, currentStudentId: string | undefined) => {
    const room = availableRooms.find((r: any) => r.roomName === roomName);
    if (!room || !room.beds) return [];

    const takenBeds = students
      .filter(
        (s) =>
          s.roomNo === roomName &&
          s._id !== currentStudentId &&
          (s.status === "pending" || s.status === "approved" || s.status === "assigned"),
      )
      .map((s) => s.bedNo);

    return room.beds.filter((b: any) => !takenBeds.includes(b.bedName) && b.bedStatus !== "Assigned");
  };

  const getFilteredRooms = (currentStudentId: string | undefined) => {
    const roomNames = Array.from(new Set(availableRooms.map((r: any) => r.roomName)));
    return roomNames.filter((rn) => getFilteredBeds(rn, currentStudentId).length > 0);
  };

  const handleModalEditToggle = () => {
    if (!isModalEditing) {
      setEditForm({ ...selectedStudent });
      fetchMasterData();
      if (selectedStudent) {
        fetchRoomsForEdit(selectedStudent.wing, selectedStudent.roomType, selectedStudent.session);
      }
    }
    setIsModalEditing(!isModalEditing);
  };

  const handleModalSave = async () => {
    if (!editForm) return;
    setProcessingId(editForm._id);
    try {
      await hostelService.updateStudentInDB(editForm.regNumber, editForm);
      setSelectedStudent(editForm);
      await fetchAllStudents();
      setIsModalEditing(false);
    } catch {
      alert("Failed to update record.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedStudent) return;
    if (!rejectRemark.trim()) {
      alert("Remark is required to reject an application.");
      return;
    }
    setProcessingId(selectedStudent._id);
    try {
      await hostelService.updateStudentInDB(selectedStudent.regNumber, {
        status: "rejected",
        rejectRemark: rejectRemark.trim(),
      });
      await fetchAllStudents();
      closeModal();
    } catch {
      alert("Failed to reject.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.roomNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.wing || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;

    // Compare date part only (YYYY-MM-DD)
    const matchesDate = !dateFilter || (s.applyDate && s.applyDate.startsWith(dateFilter));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusColor = (status: string) => {
    if (status === "approved" || status === "assigned")
      return "bg-emerald-500 text-white shadow-lg shadow-emerald-200";
    if (status === "rejected")
      return "bg-red-500 text-white shadow-lg shadow-red-200";
    return "bg-amber-100 text-amber-700";
  };

  const statusDot = (status: string) => {
    if (status === "approved" || status === "assigned" || status === "rejected")
      return "bg-white";
    return "bg-amber-600 animate-ping";
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans transition-all">
      {/* ERP Push Confirmation Modal */}
      {showErpConfirm && erpPushData && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowErpConfirm(false)}
          />
          <div className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-tight">Final ERP Review</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-2 opacity-80">Check details before pushing</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg font-black text-indigo-600">
                    {erpPushData.name?.[0] || erpPushData.regNumber[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{erpPushData.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{erpPushData.regNumber}</p>
                  </div>
                </div>

                {/* Allocation Details */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Wing", value: erpPushData.wing, icon: "🏢" },
                    { label: "Room", value: erpPushData.roomNo, icon: "🚪" },
                    { label: "Bed", value: erpPushData.bedNo, icon: "🛏️" },
                    { label: "Frequency", value: erpPushData.paymentFreq, icon: "💳" }
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                        <span>{item.icon}</span> {item.label}
                      </p>
                      <p className="text-xs font-black text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Dates */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 mb-1">Start Date</p>
                    <p className="text-xs font-black text-slate-800">{formatDate(erpPushData.startDate)}</p>
                  </div>
                  <div className="w-8 h-[1px] bg-amber-200" />
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 mb-1">End Date</p>
                    <p className="text-xs font-black text-slate-800">{formatDate(erpPushData.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-base">⚠️</span>
                  <p className="text-[10px] font-bold text-red-700 leading-relaxed uppercase tracking-tight">
                    Warning: This will permanently update the ERP system. Ensure all details are correct.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => setShowErpConfirm(false)}
                  className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Go Back
                </button>
                <button
                  onClick={executeERPPush}
                  className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
                >
                  Confirm & Push
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">
            <span style={{ color: "rgb(237,128,65)" }}> Okie Dokie</span>{" "}
            <span className="italic">Warden ERP Portal</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-slate-200 inline-block">
            Managed Allocation System
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="px-4 py-3 bg-white text-slate-400 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
          >
            Logout
          </button>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search Registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border-2 border-slate-200 rounded-2xl w-full md:w-80 shadow-xl shadow-slate-200/20 focus:border-red-500/50 outline-none transition-all font-bold text-sm"
            />
            <svg
              className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-red-500/50 shadow-xl shadow-slate-200/20 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="assigned">Assigned</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-red-500/50 shadow-xl shadow-slate-200/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Applications + Detail panel */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Applications List */}
        <div className="lg:col-span-1 bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Applications
            </h2>
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
              {filteredStudents.length}
            </span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse h-14 bg-slate-100 rounded-xl"
                  />
                ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-400 font-black">No applications yet.</p>
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-1">
                Waiting for registrations...
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {filteredStudents.map((student, index) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentClick(student)}
                  className={`w-full text-left px-5 py-4 flex items-center gap-3 transition-all hover:bg-slate-50 ${selectedStudent?._id === student._id ? "bg-red-50 border-l-4 border-red-500" : ""}`}
                >
                  <span className="text-[11px] font-black text-slate-300 w-5 flex-shrink-0 text-right">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {student.name || student.regNumber}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {student.regNumber}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-black text-slate-500">
                      {formatDate(student.applyDate)}
                    </p>
                    <div
                      className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusColor(student.status)}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${statusDot(student.status)}`}
                      />
                      {student.status || "pending"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail + Actions */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl font-black text-slate-900 mb-1">
                    {selectedStudent.name || "Student Detail"}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {selectedStudent.regNumber}
                    </span>
                    <span>·</span>
                    <span>Applied: {formatDate(selectedStudent.applyDate)}</span>
                    <span
                      className={`ml-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${statusColor(selectedStudent.status)}`}
                    >
                      <div
                        className={`w-1 h-1 rounded-full ${statusDot(selectedStudent.status)}`}
                      />
                      {selectedStudent.status || "pending"}
                    </span>
                    {selectedStudent.rejectRemark && (
                      <span className="ml-2 text-[10px] text-red-500 font-bold uppercase tracking-tight">
                        · {selectedStudent.rejectRemark}
                      </span>
                    )}
                  </div>

                  {(selectedErpStudent?.course || selectedErpStudent?.stream) && (
                    <p className="text-xs font-bold text-slate-700 mb-1.5">
                      {selectedErpStudent.course}
                      {selectedErpStudent.stream ? ` • ${selectedErpStudent.stream}` : ""}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500">
                    {selectedErpStudent?.batch && (
                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        Batch: {selectedErpStudent.batch}
                      </span>
                    )}
                    {selectedErpStudent?.section && (
                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        Sec: {selectedErpStudent.section}
                      </span>
                    )}
                    {selectedErpStudent?.phone && (
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span>📞</span> {selectedErpStudent.phone}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-slate-300 hover:text-red-500 transition-colors p-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Application Details
                  </h3>
                  <button
                    onClick={handleModalEditToggle}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                  >
                    {isModalEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {isModalEditing ? (
                    <>
                      {/* Editable Fields in Modal */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Session</p>
                        <p className="text-sm font-black text-slate-800">{editForm.session}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Wing</p>
                        <select
                          className="w-full text-sm font-black bg-transparent outline-none"
                          value={editForm.wing}
                          onChange={(e) => setEditForm({ ...editForm, wing: e.target.value })}
                        >
                          {masterData?.hostel.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Room Type</p>
                        <select
                          className="w-full text-sm font-black bg-transparent outline-none"
                          value={editForm.roomType}
                          onChange={(e) => setEditForm({ ...editForm, roomType: e.target.value })}
                        >
                          {masterData?.roomType.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                        </select>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Room No</p>
                        <select
                          className="w-full text-xs font-black bg-transparent outline-none"
                          value={editForm?.roomNo || ""}
                          onChange={(e) => setEditForm({ ...editForm, roomNo: e.target.value })}
                        >
                          {editForm && getFilteredRooms(editForm._id).map((rn: any) => (
                            <option key={rn} value={rn}>{rn}</option>
                          ))}
                        </select>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Bed No</p>
                        <select
                          className="w-full text-xs font-black bg-transparent outline-none"
                          value={editForm?.bedNo || ""}
                          onChange={(e) => setEditForm({ ...editForm, bedNo: e.target.value })}
                        >
                          {editForm && getFilteredBeds(editForm.roomNo, editForm._id).map((b: any) => (
                            <option key={b.bedName} value={b.bedName}>{b.bedName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 col-span-2 sm:col-span-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Remark</p>
                        <p className="text-sm font-black text-slate-800">{editForm?.remark || "—"}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <button
                          onClick={handleModalSave}
                          className="w-full bg-slate-900 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                          {processingId ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {[
                        { label: "Session", value: selectedStudent?.session },
                        { label: "Wing", value: selectedStudent?.wing },
                        { label: "Room Type", value: selectedStudent?.roomType },
                        { label: "Room No", value: selectedStudent?.roomNo },
                        { label: "Bed No", value: selectedStudent?.bedNo },
                        { label: "Remark", value: selectedStudent?.remark || "—" },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className={`bg-slate-50 rounded-xl p-2.5 border border-slate-100 ${label === "Remark" ? "col-span-2 sm:col-span-3" : ""}`}
                        >
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                            {label}
                          </p>
                          <p className="text-xs font-black text-slate-800 leading-tight">
                            {value || "—"}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {selectedStudent.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-slideUp">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Final ERP Configuration
                    </p>
                    {showRejectBox ? (
                      <div className="space-y-3">
                        <textarea
                          value={rejectRemark}
                          onChange={(e) => setRejectRemark(e.target.value)}
                          placeholder="Reason for rejection..."
                          className="w-full p-3 border border-red-100 rounded-xl text-xs font-bold bg-red-50/30 outline-none focus:ring-2 focus:ring-red-100 transition-all resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleReject}
                            disabled={!!processingId || !rejectRemark.trim()}
                            className="bg-red-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:grayscale"
                          >
                            {processingId ? "Processing..." : "Confirm Reject"}
                          </button>
                          <button
                            onClick={() => setShowRejectBox(false)}
                            className="border border-slate-200 text-slate-400 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              className="w-full bg-transparent text-xs font-bold outline-none"
                              value={approveStartDate}
                              onChange={(e) => setApproveStartDate(e.target.value)}
                            />
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              className="w-full bg-transparent text-xs font-bold outline-none"
                              value={approveEndDate}
                              onChange={(e) => setApproveEndDate(e.target.value)}
                            />
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                              Frequency
                            </label>
                            <select
                              className="w-full bg-transparent text-xs font-bold outline-none"
                              value={approvePaymentFreq}
                              onChange={(e) => setApprovePaymentFreq(e.target.value)}
                            >
                              <option value="">Select Frequency</option>
                              {masterData?.paymentFrequency.map((pf) => (
                                <option key={pf} value={pf}>
                                  {pf}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!selectedStudent) return;
                              if (!approveStartDate || !approveEndDate || !approvePaymentFreq) {
                                alert("Please set the dates and frequency first.");
                                return;
                              }
                              const updatedStudent = {
                                ...selectedStudent,
                                startDate: approveStartDate,
                                endDate: approveEndDate,
                                paymentFreq: approvePaymentFreq,
                              };
                              await handleAssignToERP(updatedStudent);
                            }}
                            disabled={!!processingId}
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                          >
                            {processingId ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>Finalize & Push to ERP</span>
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-3 h-3"
                                >
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowRejectBox(true)}
                            className="bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  📋
                </div>
                <p className="text-slate-400 font-black text-lg">
                  Select an Application
                </p>
                <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">
                  Click a student from the left to review
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Registry Table */}
      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl overflow-hidden min-h-[60vh]">
        <div className="px-8 py-5 border-b border-slate-100">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Full Registry
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/5 backdrop-blur-md">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Registry Detail
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Wing Configuration
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Room Metadata
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Billing Detail
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Current Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">
                  Control
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-10">
                        <div className="h-4 bg-slate-100 rounded-full" />
                      </td>
                    </tr>
                  ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className={`transition-all ${editingId === student._id ? "bg-red-50/50 ring-1 ring-inset ring-red-100" : "hover:bg-white"}`}
                  >
                    <td className="px-8 py-6">
                      <div className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        {formatDate(student.applyDate)}
                      </div>
                      <div className="font-black text-slate-900 text-lg leading-none">
                        {student.regNumber}
                      </div>
                      {student.name && (
                        <div className="text-xs text-slate-600 font-bold mt-1">
                          {student.name}
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 font-black mt-2 uppercase bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                        {student.session}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {editingId === student._id ? (
                        <div className="flex flex-col gap-2">
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.wing}
                            onChange={(e) =>
                              setEditForm({ ...editForm, wing: e.target.value })
                            }
                          >
                            <option value="">Wing</option>
                            {masterData?.hostel.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.roomType}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                roomType: e.target.value,
                              })
                            }
                          >
                            <option value="">Room Type</option>
                            {masterData?.roomType.map((rt) => (
                              <option key={rt} value={rt}>
                                {rt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-black text-slate-800 uppercase line-clamp-1">
                            {student.wing}
                          </div>
                          <div className="text-[10px] text-slate-400 font-black uppercase">
                            {student.roomType}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {editingId === student._id && editForm ? (
                        <div className="flex flex-col gap-2">
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.roomNo || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                roomNo: e.target.value,
                              })
                            }
                          >
                            <option value="">Room</option>
                            {getFilteredRooms(editForm._id).map((rn: any) => (
                              <option key={rn} value={rn}>
                                {rn}
                              </option>
                            ))}
                          </select>
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.bedNo || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                bedNo: e.target.value,
                              })
                            }
                          >
                            <option value="">Bed</option>
                            {getFilteredBeds(editForm.roomNo, editForm._id).map((b: any) => (
                              <option key={b.bedName} value={b.bedName}>
                                {b.bedName}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase">
                            RM {student.roomNo}
                          </div>
                          <div className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">
                            BD {student.bedNo}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {editingId === student._id && editForm ? (
                        <select
                          className="text-[11px] font-bold border border-slate-200 rounded-lg p-1 w-full"
                          value={editForm.paymentFreq || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              paymentFreq: e.target.value,
                            })
                          }
                        >
                          <option value="">Frequency</option>
                          {masterData?.paymentFrequency.map((pf) => (
                            <option key={pf} value={pf}>
                              {pf}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase italic">
                            {student.paymentFreq}
                          </div>
                          {(student.startDate || student.endDate) && (
                            <div className="text-[9px] text-slate-400 font-bold mt-1">
                              {formatDate(student.startDate)} — {formatDate(student.endDate)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(student.status)}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${statusDot(student.status)}`}
                        />
                        {student.status || "pending"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit is locked once approved/assigned */}
                        {student.status !== "approved" &&
                          student.status !== "assigned" && (
                            editingId === student._id ? (
                              <button
                                onClick={handleSaveEdit}
                                disabled={!!processingId}
                                className="bg-slate-900 text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditClick(student)}
                                className="bg-white border-2 border-slate-100 text-slate-400 p-2 rounded-xl hover:border-red-500 hover:text-red-500 transition-all font-black text-xs"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>
                            )
                          )}
                        {student.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setApproveStartDate("");
                              setApproveEndDate("");
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                          >
                            Finalize ERP
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black text-lg">
                      No student records found yet.
                    </p>
                    <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">
                      Waiting for new registrations...
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
