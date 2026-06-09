import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

interface StudentRecord {
  _id: string;
  regNumber: string;
  name: string;
  applyDate: string;
  session: string;
  entityId: string;
  collegeName: string;
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

  // Hold Room state
  const [heldRooms, setHeldRooms] = useState<{ roomName: string; bedName: string; heldAt: string }[]>([]);
  const [holdLoading, setHoldLoading] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdForm, setHoldForm] = useState<{ wing: string; roomType: string; roomName: string; selectedBeds: string[] }>({ wing: "", roomType: "", roomName: "", selectedBeds: [] });
  const [holdAvailableRooms, setHoldAvailableRooms] = useState<any[]>([]);

  // Reports state
  const [activeTab, setActiveTab] = useState<"allocations" | "reports">("allocations");
  const [reportForm, setReportForm] = useState({ wing: "", roomType: "", roomName: "" });
  const [reportAvailableRooms, setReportAvailableRooms] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Remove Hostel state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeStudent, setRemoveStudent] = useState<StudentRecord | null>(null);
  const [removeRemark, setRemoveRemark] = useState("-");
  const [removeInstallments, setRemoveInstallments] = useState<string[]>(["Even"]);
  const [removeLoading, setRemoveLoading] = useState(false);

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

  const fetchHeldRooms = async () => {
    try {
      const data = await hostelService.getHeldRooms();
      setHeldRooms(data);
    } catch (err) {
      console.error("Error fetching held rooms:", err);
    }
  };

  const handleHoldRoom = async () => {
    if (!holdForm.roomName || holdForm.selectedBeds.length === 0) return;
    setHoldLoading(true);
    try {
      await Promise.all(holdForm.selectedBeds.map(bed => hostelService.holdRoom(holdForm.roomName, bed)));
      setHoldForm((prev) => ({ ...prev, roomName: "", selectedBeds: [] }));
      await fetchHeldRooms();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to hold bed(s).");
    } finally {
      setHoldLoading(false);
    }
  };

  const fetchHoldRooms = async (wing: string, roomType: string) => {
    if (!wing || !roomType) { setHoldAvailableRooms([]); return; }
    try {
      const data = await hostelService.getHostelRooms({
        entity: ENTITY_ID,
        session: "2025-26 Even",
        hostel: wing,
        roomType,
      });
      const rooms = Array.isArray(data) ? data : data.data || [];
      setHoldAvailableRooms(rooms);
    } catch (err) {
      console.error("Error fetching hold rooms:", err);
    }
  };

  const fetchReportRooms = async (wing: string, roomType: string) => {
    if (!wing || !roomType) { setReportAvailableRooms([]); return; }
    try {
      const data = await hostelService.getHostelRooms({
        entity: ENTITY_ID,
        session: "2025-26 Even",
        hostel: wing,
        roomType,
      });
      const rooms = Array.isArray(data) ? data : data.data || [];
      setReportAvailableRooms(rooms);
    } catch (err) {
      console.error("Error fetching report rooms:", err);
    }
  };

  const handleFetchReport = async () => {
    if (!reportForm.wing || !reportForm.roomType || !reportForm.roomName) return;
    setReportLoading(true);
    setReportData([]);
    try {
      const payload = {
        entity: ENTITY_ID,
        session: "2025-26 Even",
        course: ["all"],
        batch: ["all"],
        hostel: [reportForm.wing],
        hostelRoomName: [reportForm.roomName],
        hostelRoomType: [reportForm.roomType],
        pageNumber: 1,
        pageSize: 100,
        section: ["all"],
        stream: ["all"]
      };
      const data = await hostelService.getStudentReports(payload);
      setReportData(data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to fetch report.";
      if (msg.toLowerCase().includes("no student found")) {
        setReportData([]);
      } else {
        console.error(msg);
      }
    } finally {
      setReportLoading(false);
    }
  };

  const openHoldModal = () => {
    setShowHoldModal(true);
    if (!masterData) fetchMasterData();
  };

  const handleUnholdRoom = async (roomName: string, bedName: string) => {
    setHoldLoading(true);
    try {
      await hostelService.unholdRoom(roomName, bedName);
      await fetchHeldRooms();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to unhold bed.");
    } finally {
      setHoldLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/warden/login");
    } else {
      fetchAllStudents();
      fetchHeldRooms();
      fetchMasterData();
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

  const fetchMasterData = async (entityId: string = ENTITY_ID) => {
    try {
      const data = await hostelService.getHostelMaster(entityId);
      if (data) setMasterData(data);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  const fetchRoomsForEdit = async (
    entityId: string,
    wing: string,
    type: string,
    session: string,
  ) => {
    if (!wing || !type || !session || !entityId) return;
    try {
      const data = await hostelService.getHostelRooms({
        entity: entityId,
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

  const getCollegeName = (student: StudentRecord) => {
    if (student.collegeName) return student.collegeName;
    // Fallbacks for older records that didn't have collegeName saved
    if (student.entityId === "5e74b933c14d052673463fd3") return "JMIT";
    return "JMIETI"; // Default fallback since it was the original hardcoded entity
  };

  const handleEditClick = (student: StudentRecord) => {
    setEditingId(student._id);
    setEditForm({ ...student });
    fetchMasterData(student.entityId || ENTITY_ID);
    fetchRoomsForEdit(student.entityId || ENTITY_ID, student.wing, student.roomType, student.session);
  };

  useEffect(() => {
    if ((editingId || isModalEditing) && editForm) {
      fetchRoomsForEdit(editForm.entityId || ENTITY_ID, editForm.wing, editForm.roomType, editForm.session);
    }
  }, [editForm?.wing, editForm?.roomType, editingId, isModalEditing]);

  const handleSaveEdit = async () => {
    if (!editForm) return;
    if (!editForm.wing || !editForm.roomType || !editForm.roomNo || !editForm.bedNo) {
      alert("Please select Wing, Room Type, Room No, and Bed No before saving.");
      return;
    }
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
        entity: student.entityId || ENTITY_ID,
        session: student.session,
        regNo: student.regNumber,
      });
      if (!erpStudent || !erpStudent._id) {
        alert("Student not found in ERP system.");
        return;
      }
      const wings = await hostelService.getHostelRooms({
        entity: student.entityId || ENTITY_ID,
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
        startDate: student.startDate,
        endDate: student.endDate,
        paymentFreq: student.paymentFreq,
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
    fetchMasterData(student.entityId || ENTITY_ID);

    try {
      const erpData = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: student.entityId || ENTITY_ID,
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
      fetchMasterData(selectedStudent?.entityId || ENTITY_ID);
      if (selectedStudent) {
        fetchRoomsForEdit(selectedStudent.entityId || ENTITY_ID, selectedStudent.wing, selectedStudent.roomType, selectedStudent.session);
      }
    }
    setIsModalEditing(!isModalEditing);
  };

  const handleModalSave = async () => {
    if (!editForm) return;
    if (!editForm.wing || !editForm.roomType || !editForm.roomNo || !editForm.bedNo) {
      alert("Please select Wing, Room Type, Room No, and Bed No before saving.");
      return;
    }
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

  const handleRemoveHostel = async () => {
    if (!removeStudent) return;
    setRemoveLoading(true);
    try {
      const erpData = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: removeStudent.entityId || ENTITY_ID,
        session: removeStudent.session,
        regNo: removeStudent.regNumber,
      });
      if (!erpData || !erpData._id) {
        alert("Student not found in ERP system.");
        setRemoveLoading(false);
        return;
      }

      await hostelService.removeFromStudentHostelRoom(
        erpData._id,
        removeRemark,
        removeInstallments
      );

      await hostelService.updateStudentInDB(removeStudent.regNumber, {
        status: "pending",
        roomNo: "",
        bedNo: "",
        startDate: "",
        endDate: "",
        paymentFreq: ""
      });

      alert("Hostel removed from student successfully.");
      setShowRemoveModal(false);
      setRemoveStudent(null);
      await fetchAllStudents();
    } catch (err: any) {
      console.error("Remove Error:", err);
      alert("Failed to remove hostel from student.");
    } finally {
      setRemoveLoading(false);
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
      {/* Remove Hostel Modal */}
      {showRemoveModal && removeStudent && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowRemoveModal(false)}
          />
          <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">Delete Remark</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 border-b border-slate-200 focus-within:border-red-500 pb-1">
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Remark</label>
                  <input
                    type="text"
                    value={removeRemark}
                    onChange={(e) => setRemoveRemark(e.target.value)}
                    className="w-full text-sm font-bold bg-transparent outline-none"
                    placeholder="Enter remark"
                  />
                </div>
                <div className="flex-1 border-b border-slate-200 focus-within:border-red-500 pb-1">
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Select Installments To Re...</label>
                  <select
                    value={removeInstallments[0]}
                    onChange={(e) => setRemoveInstallments([e.target.value])}
                    className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                  >
                    <option value="Even">Even</option>
                    <option value="Odd">Odd</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="px-4 py-2 text-slate-500 font-black text-xs hover:bg-slate-50 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveHostel}
                  disabled={removeLoading}
                  className="px-4 py-2 bg-red-600 text-white font-black text-xs rounded-lg hover:bg-red-700 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {removeLoading ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERP Push Confirmation Modal */}
      {showErpConfirm && erpPushData && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowErpConfirm(false)}
          />
          <div className="bg-white rounded-[2rem] w-full max-w-lg relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight leading-tight">Final ERP Review</h3>
                  <p className="text-indigo-100 text-[9px] font-bold uppercase tracking-widest mt-1 opacity-80">Check details before pushing</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="space-y-3">
                {/* Student Info */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-base font-black text-indigo-600">
                    {erpPushData.name?.[0] || erpPushData.regNumber[0]}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{erpPushData.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{erpPushData.regNumber}</p>
                  </div>
                </div>

                {/* Allocation Details */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Wing", value: erpPushData.wing, icon: "🏢" },
                    { label: "Room", value: erpPushData.roomNo, icon: "🚪" },
                    { label: "Bed", value: erpPushData.bedNo, icon: "🛏️" },
                    { label: "Frequency", value: erpPushData.paymentFreq, icon: "💳" }
                  ].map((item) => (
                    <div key={item.label} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
                        <span>{item.icon}</span> {item.label}
                      </p>
                      <p className="text-[11px] font-black text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Dates */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
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

                <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-sm">⚠️</span>
                  <p className="text-[9px] font-bold text-red-700 leading-relaxed uppercase tracking-tight">
                    Warning: This will permanently update the ERP system. Ensure all details are correct.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setShowErpConfirm(false)}
                  className="py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Go Back
                </button>
                <button
                  onClick={executeERPPush}
                  className="py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
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
            onClick={openHoldModal}
            className="px-4 py-3 bg-amber-500 text-white border border-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Hold Beds
            {heldRooms.length > 0 && (
              <span className="bg-white/25 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{heldRooms.length}</span>
            )}
          </button>
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

      {/* ── Room Hold Modal ── */}
      {showHoldModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowHoldModal(false)}
          />
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-amber-500 px-8 py-8 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight leading-tight">Bed Hold Management</h3>
                  <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mt-2 opacity-80">Hold or release beds for allocation</p>
                </div>
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="text-white/60 hover:text-white transition-colors p-2 self-start"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="p-8 overflow-y-auto flex-1">
              {/* Hold a Room section */}
              <div className="mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Hold a Bed
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Wing */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Hostel Wing</label>
                    <select
                      className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                      value={holdForm.wing}
                      onChange={(e) => {
                        const wing = e.target.value;
                        setHoldForm({ wing, roomType: "", roomName: "", selectedBeds: [] });
                        setHoldAvailableRooms([]);
                      }}
                    >
                      <option value="">Select Wing</option>
                      {masterData?.hostel.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  {/* Room Type */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Room Type</label>
                    <select
                      className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                      value={holdForm.roomType}
                      onChange={(e) => {
                        const roomType = e.target.value;
                        setHoldForm((prev) => ({ ...prev, roomType, roomName: "", selectedBeds: [] }));
                        fetchHoldRooms(holdForm.wing, roomType);
                      }}
                      disabled={!holdForm.wing}
                    >
                      <option value="">Select Type</option>
                      {masterData?.roomType.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                    </select>
                  </div>
                </div>

                {/* Room Identifier */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Room Identifier</label>
                  <select
                    className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                    value={holdForm.roomName}
                    onChange={(e) => setHoldForm((prev) => ({ ...prev, roomName: e.target.value, selectedBeds: [] }))}
                    disabled={!holdForm.wing || !holdForm.roomType || holdAvailableRooms.length === 0}
                  >
                    <option value="">
                      {holdForm.wing && holdForm.roomType && holdAvailableRooms.length === 0
                        ? "No rooms found"
                        : "Select Room"}
                    </option>
                    {Array.from(new Set(holdAvailableRooms.map((r: any) => r.roomName))).map((rn: any) => {
                      return (
                        <option key={rn} value={rn}>
                          {rn}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Bed Allocation Checkboxes */}
                {holdForm.roomName && (() => {
                  const room = holdAvailableRooms.find((r: any) => r.roomName === holdForm.roomName);
                  const beds = room?.beds || [];
                  if (beds.length === 0) return null;

                  return (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 animate-fadeIn">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-3">Select Beds to Hold</label>
                      <div className="grid grid-cols-2 gap-3">
                        {beds.map((b: any) => {
                          const isAlreadyHeld = heldRooms.some((hr) => hr.roomName === holdForm.roomName && hr.bedName === b.bedName);
                          const isSelected = holdForm.selectedBeds.includes(b.bedName);

                          return (
                            <label
                              key={b.bedName}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${isAlreadyHeld
                                  ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-amber-50 border-amber-400 shadow-md shadow-amber-100/50"
                                    : "bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/30"
                                }`}
                            >
                              <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${isAlreadyHeld
                                  ? "bg-slate-200 border-slate-300"
                                  : isSelected
                                    ? "bg-amber-500 border-amber-500 text-white"
                                    : "bg-white border-slate-300"
                                }`}>
                                {isSelected && (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isAlreadyHeld ? "text-slate-400" : "text-slate-700"}`}>
                                  {b.bedName}
                                </span>
                                {isAlreadyHeld && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 mt-0.5">Currently Held</span>}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                disabled={isAlreadyHeld}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (isAlreadyHeld) return;
                                  setHoldForm(prev => ({
                                    ...prev,
                                    selectedBeds: e.target.checked
                                      ? [...prev.selectedBeds, b.bedName]
                                      : prev.selectedBeds.filter(bed => bed !== b.bedName)
                                  }));
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={handleHoldRoom}
                  disabled={holdLoading || !holdForm.roomName || holdForm.selectedBeds.length === 0}
                  className="w-full py-3.5 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-amber-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {holdLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Hold {holdForm.selectedBeds.length > 0 ? `${holdForm.selectedBeds.length} Selected Bed${holdForm.selectedBeds.length > 1 ? 's' : ''}` : "Selected Beds"}
                    </>
                  )}
                </button>
              </div>

              {/* Held Rooms List */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Currently Held
                  </span>
                  <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">{heldRooms.length}</span>
                </h4>
                {heldRooms.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="text-3xl mb-2">🔓</div>
                    <p className="text-slate-300 text-xs font-black uppercase tracking-widest">No beds on hold</p>
                    <p className="text-slate-300 text-[9px] font-bold mt-1">All beds are available for allocation</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {heldRooms.map((room) => (
                      <div
                        key={`${room.roomName}-${room.bedName}`}
                        className="flex items-center justify-between px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl transition-all hover:bg-amber-100 group"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-sm font-black text-slate-800">{room.roomName} — {room.bedName}</span>
                        </div>
                        <button
                          onClick={() => handleUnholdRoom(room.roomName, room.bedName)}
                          disabled={holdLoading}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                        >
                          Unhold
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
                  {filteredStudents.slice(0, 5).map((student, index) => (
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
                        <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider truncate mb-0.5">
                          {getCollegeName(student)}
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
                      <h2 className="text-xl font-black text-slate-900 mb-0.5">
                        {selectedStudent.name || "Student Detail"}
                      </h2>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2.5">
                        {getCollegeName(selectedStudent)}
                      </p>
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
                              onChange={(e) => setEditForm({ ...editForm, wing: e.target.value, roomType: "", roomNo: "", bedNo: "" })}
                            >
                              <option value="">Select Wing</option>
                              {masterData?.hostel.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Prev: {selectedStudent?.wing || "—"}</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Room Type</p>
                            <select
                              className="w-full text-sm font-black bg-transparent outline-none"
                              value={editForm.roomType}
                              onChange={(e) => setEditForm({ ...editForm, roomType: e.target.value, roomNo: "", bedNo: "" })}
                            >
                              <option value="">Select Type</option>
                              {masterData?.roomType.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                            </select>
                            <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Prev: {selectedStudent?.roomType || "—"}</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Room No</p>
                            <select
                              className="w-full text-xs font-black bg-transparent outline-none"
                              value={editForm?.roomNo || ""}
                              onChange={(e) => setEditForm({ ...editForm, roomNo: e.target.value, bedNo: "" })}
                            >
                              <option value="">Select Room</option>
                              {editForm && getFilteredRooms(editForm._id).map((rn: any) => (
                                <option key={rn} value={rn}>{rn}</option>
                              ))}
                            </select>
                            <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Prev: {selectedStudent?.roomNo || "—"}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Bed No</p>
                            <select
                              className="w-full text-xs font-black bg-transparent outline-none"
                              value={editForm?.bedNo || ""}
                              onChange={(e) => setEditForm({ ...editForm, bedNo: e.target.value })}
                            >
                              <option value="">Select Bed</option>
                              {editForm && getFilteredBeds(editForm.roomNo, editForm._id).map((b: any) => (
                                <option key={b.bedName} value={b.bedName}>{b.bedName}</option>
                              ))}
                            </select>
                            <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Prev: {selectedStudent?.bedNo || "—"}</p>
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

          
      {/* Tab Switcher */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-4">
        <button
          onClick={() => setActiveTab("allocations")}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "allocations" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Full Registry
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "reports" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Roommates Report
        </button>
      </div>

      {activeTab === "reports" ? (
        <div className="max-w-7xl mx-auto mb-8 bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">Roommates Report</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Search ERP for room occupants</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Wing */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Hostel Wing</label>
              <select
                className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                value={reportForm.wing}
                onChange={(e) => {
                  const wing = e.target.value;
                  setReportForm({ wing, roomType: "", roomName: "" });
                  setReportAvailableRooms([]);
                }}
              >
                <option value="">Select Wing</option>
                {masterData?.hostel?.map((h: string) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Room Type */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Room Type</label>
              <select
                className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                value={reportForm.roomType}
                onChange={(e) => {
                  const roomType = e.target.value;
                  setReportForm((prev) => ({ ...prev, roomType, roomName: "" }));
                  fetchReportRooms(reportForm.wing, roomType);
                }}
                disabled={!reportForm.wing}
              >
                <option value="">Select Type</option>
                {masterData?.roomType?.map((rt: string) => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>

            {/* Room Identifier */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Room Identifier</label>
              <select
                className="w-full text-sm font-bold bg-transparent outline-none cursor-pointer"
                value={reportForm.roomName}
                onChange={(e) => setReportForm((prev) => ({ ...prev, roomName: e.target.value }))}
                disabled={!reportForm.wing || !reportForm.roomType || reportAvailableRooms.length === 0}
              >
                <option value="">
                  {reportForm.wing && reportForm.roomType && reportAvailableRooms.length === 0
                    ? "No rooms found"
                    : "Select Room"}
                </option>
                {Array.from(new Set(reportAvailableRooms.map((r: any) => r.roomName))).map((rn: any) => (
                  <option key={rn} value={rn}>{rn}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleFetchReport}
                disabled={reportLoading || !reportForm.roomName}
                className="w-full h-[58px] bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {reportLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Search ERP
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">S.No</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Roll No.</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Father Name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Class</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Stream</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Year</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Section</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Adm. Category</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Hostel Name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Room Name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Room Type</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Bed Name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Frequency</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">Start Date</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 whitespace-nowrap">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="px-8 py-16 text-center">
                      <p className="text-slate-400 font-black text-sm">No occupants found.</p>
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs font-black text-slate-800 whitespace-nowrap">{row.regNo || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{row.name || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.fatherName || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.course || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.stream || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.batch || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.section || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.category || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.oldNew || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.hostel || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-black px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">{row.hostelRoomName || "-"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.hostelRoomType || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-black px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-100">{row.hostelRoomBedName || "-"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.hostelPaymentFrequency || "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{row.hostelStartDate ? new Date(row.hostelStartDate).toLocaleDateString('en-GB') : "-"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{row.hostelEndDate ? new Date(row.hostelEndDate).toLocaleDateString('en-GB') : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
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
                          <div className="text-[9px] text-orange-500 font-black mt-2 uppercase bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md inline-block truncate max-w-[200px]" title={getCollegeName(student)}>
                            {getCollegeName(student)}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {editingId === student._id ? (
                            <div className="flex flex-col gap-2">
                              <div>
                                <select
                                  className="text-[11px] font-bold border border-slate-200 rounded-lg p-1 w-full"
                                  value={editForm.wing}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, wing: e.target.value, roomType: "", roomNo: "", bedNo: "" })
                                  }
                                >
                                  <option value="">Wing</option>
                                  {masterData?.hostel.map((h) => (
                                    <option key={h} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase truncate">Prev: {student.wing || "—"}</p>
                              </div>
                              <div>
                                <select
                                  className="text-[11px] font-bold border border-slate-200 rounded-lg p-1 w-full"
                                  value={editForm.roomType}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      roomType: e.target.value,
                                      roomNo: "",
                                      bedNo: "",
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
                                <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase truncate">Prev: {student.roomType || "—"}</p>
                              </div>
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
                              <div>
                                <select
                                  className="text-[11px] font-bold border border-slate-200 rounded-lg p-1 w-full"
                                  value={editForm.roomNo || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      roomNo: e.target.value,
                                      bedNo: "",
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
                                <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase truncate">Prev: {student.roomNo || "—"}</p>
                              </div>
                              <div>
                                <select
                                  className="text-[11px] font-bold border border-slate-200 rounded-lg p-1 w-full"
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
                                <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase truncate">Prev: {student.bedNo || "—"}</p>
                              </div>
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
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              title="View Details"
                              className="bg-indigo-50 border border-indigo-100 text-indigo-500 p-2 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all font-black text-xs"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </button>
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
                            {student.status === "assigned" && (
                              <button
                                onClick={() => {
                                  setRemoveStudent(student);
                                  setShowRemoveModal(true);
                                  setRemoveRemark("-");
                                  setRemoveInstallments(["Even"]);
                                }}
                                className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-600 active:scale-95 transition-all"
                              >
                                Remove
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
        </>
      )}
    </div>
  );
}
