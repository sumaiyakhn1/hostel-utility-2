import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { hostelService } from "../service/hostel.service";
import logo from "../assets/logo.png";

interface HostelMasterData {
  hostel: string[];
  roomType: string[];
  gatePassCategory: { category: string; _id: string }[];
}

interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

/* ─── Inline SVG icons ─── */
const Icon = {
  Home: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Check: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Lock: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Arrow: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Building: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Bed: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M2 4v16M22 4v16M2 8h20M2 16h20" />
      <rect x="6" y="8" width="4" height="5" rx="1" />
    </svg>
  ),
  Grid: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Calendar: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Hash: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
};

const FIELD_META: Record<string, { icon: React.FC; color: string }> = {
  session: { icon: Icon.Calendar, color: "#6366f1" },
  hostel: { icon: Icon.Building, color: "#0ea5e9" },
  roomType: { icon: Icon.Grid, color: "#8b5cf6" },
  roomNo: { icon: Icon.Hash, color: "#10b981" },
  bedNo: { icon: Icon.Bed, color: "#f59e0b" },
};

const ACCENT = "rgb(237,128,65)";
const ACCENT_LIGHT = "rgba(237,128,65,0.1)";
const ACCENT_MID = "rgba(237,128,65,0.25)";

export default function HostelDashboard() {
  const { regNo: pathRegNo } = useParams<{ regNo: string }>();
  const [searchParams] = useSearchParams();
  const queryRegNo = searchParams.get("regNo");
  const effectiveRegNo = pathRegNo || queryRegNo || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [masterData, setMasterData] = useState<HostelMasterData | null>(null);
  const [form, setForm] = useState({
    hostel: "",
    roomType: "",
    roomNo: "",
    bedNo: "",
    remark: "",
    session: "2025-26 Even",
    regNo: effectiveRegNo,
  });
  const [student, setStudent] = useState<any>(null);
  const [localStatus, setLocalStatus] = useState<string>("");
  const [rejectRemark, setRejectRemark] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const [hasReapplied, setHasReapplied] = useState(false);
  const [erpHostelAssigned, setErpHostelAssigned] = useState(false);
  const [erpHostelData, setErpHostelData] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  const addNotification = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      4000,
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await hostelService.getHostelMaster(
        "5ea04b2f774faa5d67505ab2",
      );
      if (data) setMasterData(data);

      const all = await hostelService.getAllSavedStudents();
      setAllStudents(all);
    } catch {
      setError("Failed to load hostel data.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBeds = (roomName: string) => {
    const room = availableRooms.find((r: any) => r.roomName === roomName);
    if (!room || !room.beds) return [];

    const takenBeds = allStudents
      .filter(
        (s) =>
          s.roomNo === roomName &&
          s.regNumber !== form.regNo &&
          (s.status === "pending" || s.status === "approved" || s.status === "assigned"),
      )
      .map((s) => s.bedNo);

    return room.beds.filter((b: any) => !takenBeds.includes(b.bedName) && b.bedStatus !== "Assigned");
  };

  const getFilteredRooms = () => {
    const roomNames = Array.from(new Set(availableRooms.map((r: any) => r.roomName)));
    return roomNames.filter((rn) => getFilteredBeds(rn).length > 0);
  };

  const fetchStudent = async () => {
    if (!form.regNo) return;
    try {
      const data = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: "5ea04b2f774faa5d67505ab2",
        session: form.session,
        regNo: form.regNo,
      });
      if (data) {
        setStudent(data);
        // ✅ Check if ERP already has hostel assigned
        if (data.hostel) {
          setErpHostelAssigned(true);
          setErpHostelData({
            hostel: data.hostel,
            roomType: data.hostelRoomType || "",
            roomNo: data.hostelRoomName || "",
            bedNo: data.hostelRoomBedName || "",
            startDate: data.hostelStartDate || "",
            endDate: data.hostelEndDate || "",
            paymentFreq: data.hostelPaymentFrequency || "",
          });
          return; // No need to check local DB — ERP is source of truth
        }
      }
      const localData = await hostelService.getStudentFromDB(form.regNo);
      if (localData) {
        setHasExistingRecord(true);
        if (localData.hasReapplied) setHasReapplied(true);
        setLocalStatus(localData.status || "pending");
        if (localData.rejectRemark) setRejectRemark(localData.rejectRemark);
        setForm((prev) => ({
          ...prev,
          hostel: localData.wing || prev.hostel,
          roomType: localData.roomType || prev.roomType,
          roomNo: localData.roomNo || prev.roomNo,
          bedNo: localData.bedNo || prev.bedNo,
          paymentFrequency:
            localData.paymentFreq || (prev as any).paymentFrequency,
          startDate: localData.startDate || (prev as any).startDate,
          endDate: localData.endDate || (prev as any).endDate,
        }));
      }
    } catch (err) {
      console.error("Error fetching student:", err);
    }
  };

  const fetchRooms = async () => {
    if (!form.hostel || !form.roomType) return;
    try {
      const data = await hostelService.getHostelRooms({
        entity: "5ea04b2f774faa5d67505ab2",
        session: form.session,
        hostel: form.hostel,
        roomType: form.roomType,
      });
      setAvailableRooms(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (effectiveRegNo && effectiveRegNo !== form.regNo) {
      setForm(prev => ({ ...prev, regNo: effectiveRegNo }));
    }
  }, [effectiveRegNo]);

  useEffect(() => {
    if (form.regNo) {
      fetchStudent();
    }
  }, [form.session, form.regNo]);

  useEffect(() => {
    fetchRooms();
  }, [form.hostel, form.roomType, form.session]);

  const isLocked =
    localStatus === "pending" ||
    localStatus === "reapplied" ||
    localStatus === "approved" ||
    localStatus === "rejected" ||
    localStatus === "assigned";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (isLocked) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      const payload = {
        name: student?.name || "",
        session: form.session,
        wing: form.hostel,
        roomNo: form.roomNo,
        bedNo: form.bedNo,
        roomType: form.roomType,
        paymentFreq: (form as any).paymentFrequency,
        startDate: (form as any).startDate,
        endDate: (form as any).endDate,
        remark: form.remark || "",
        status: hasExistingRecord ? "reapplied" : "pending",
        hasReapplied: hasExistingRecord ? true : false,
        rejectRemark: "",
      };

      if (hasExistingRecord) {
        await hostelService.updateStudentInDB(form.regNo, payload);
      } else {
        await hostelService.saveStudentToDB(form.regNo, payload);
      }
      addNotification("Request submitted! Pending approval.", "success");
      setLocalStatus(hasExistingRecord ? "reapplied" : "pending");
    } catch (error: any) {
      addNotification(
        error.response?.status === 409
          ? "You are already registered!"
          : "Submission failed.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const validateAndShowConfirm = () => {
    if (!form.hostel || !form.roomType || !form.roomNo || !form.bedNo) {
      addNotification("Please fill all fields.", "error");
      return;
    }
    setShowConfirm(true);
  };

  /* ─── Loading ─── */
  if (loading && !masterData)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg,#fff9f4 0%,#fff 60%,#fff4ec 100%)`,
        }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-2xl relative"
            style={{ background: ACCENT }}
          >
            H
            <div
              className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{ background: ACCENT }}
            />
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: ACCENT,
                  animation: `dotBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Loading Portal
          </p>
        </div>
      </div>
    );

  /* ─── Error ─── */
  if (error)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg,#fff9f4,#fff)` }}
      >
        <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl border border-orange-100 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
            style={{ background: ACCENT_LIGHT }}
          >
            ⚠️
          </div>
          <p className="font-black text-slate-800 text-base mb-6 uppercase tracking-tight">
            {error}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
              style={{ background: ACCENT }}
            >
              Retry
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );

  const fields = [
    {
      label: "Academic Session",
      name: "session",
      options: student?.sessionList || [form.session],
    },
    { label: "Hostel Wing", name: "hostel", options: masterData?.hostel || [] },
    {
      label: "Room Category",
      name: "roomType",
      options: masterData?.roomType || [],
    },
    {
      label: "Room Identifier",
      name: "roomNo",
      options: getFilteredRooms(),
    },
    {
      label: "Bed Allocation",
      name: "bedNo",
      options: getFilteredBeds(form.roomNo).map((b: any) => b.bedName),
    },
  ];

  const filledCount = fields.filter((f) => !!(form as any)[f.name]).length;
  const progressPct = Math.round((filledCount / fields.length) * 100);

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background: `linear-gradient(150deg, #fff9f4 0%, #ffffff 45%, #fff4ec 100%)`,
      }}
    >
      {/* bg pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(237,128,65,0.055) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />
      <div
        className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
        style={{ background: ACCENT, filter: "blur(110px)" }}
      />

      {/* ── Toasts ── */}
      <div className="fixed bottom-5 right-4 z-[300] flex flex-col gap-2 w-72">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-white text-[11px] font-bold uppercase tracking-wide"
            style={{
              background:
                n.type === "success"
                  ? "#10b981"
                  : n.type === "error"
                    ? ACCENT
                    : "#1e293b",
              border: `1px solid ${n.type === "success" ? "#34d39980" : n.type === "error" ? ACCENT_MID : "#33415580"}`,
              animation: "slideIn 0.35s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <span className="text-base flex-shrink-0">
              {n.type === "success" ? "✓" : n.type === "error" ? "✕" : "i"}
            </span>
            {n.message}
          </div>
        ))}
      </div>

      {/* ── Confirm modal ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4"
          style={{
            background: "rgba(10,10,10,0.55)",
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.25s ease",
          }}
        >
          <div
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-[0_40px_80px_rgba(0,0,0,0.25)] border border-orange-100"
            style={{ animation: "slideUp 0.3s cubic-bezier(.22,1,.36,1)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
              style={{ background: ACCENT_LIGHT }}
            >
              🏠
            </div>
            <h2 className="text-xl font-black text-slate-900 text-center mb-2 tracking-tight">
              Confirm Booking
            </h2>
            <p className="text-slate-400 text-xs text-center font-semibold leading-relaxed mb-6">
              Requesting{" "}
              <span className="font-black text-slate-800">
                Room {form.roomNo}
              </span>{" "}
              ·{" "}
              <span className="font-black text-slate-800">
                Bed {form.bedNo}
              </span>
              <br />
              <span className="text-orange-400">
                This cannot be changed after submission.
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 shadow-lg"
                style={{
                  background: ACCENT,
                  boxShadow: `0 8px 24px rgba(237,128,65,0.35)`,
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          LAYOUT: sidebar + main
      ════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
        {/* ── SIDEBAR ── */}
        <aside
          className="lg:w-[280px] xl:w-[320px] lg:min-h-screen lg:sticky lg:top-0 lg:flex lg:flex-col"
          style={{ background: ACCENT }}
        >
          {/* Mobile header only */}
          <div className="flex items-center justify-between px-5 py-4 lg:hidden">
            <div
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 bg-white/25 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md">
                <img src={logo} alt="my pic" />
              </div>
              <div>
                <p className="font-black text-white text-sm uppercase tracking-tight leading-none">
                  Okie Dokie
                </p>
                <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest">
                  Hostel Management
                </p>
              </div>
            </div>
            {localStatus && (
              <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-[9px] font-black uppercase tracking-widest">
                {localStatus}
              </span>
            )}
          </div>

          {/* Desktop sidebar content */}
          <div className="hidden lg:flex flex-col h-full p-10 relative overflow-hidden">
            {/* Orb decorations */}
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/8"
              style={{ filter: "blur(40px)" }}
            />
            <div
              className="absolute bottom-20 -left-10 w-32 h-32 rounded-full bg-white/5"
              style={{ filter: "blur(30px)" }}
            />

            {/* Logo */}
            <div
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-3 mb-12 cursor-pointer group w-fit"
            >
              <div className="w-11 h-11 flex items-center justify-center font-black text-xl">
                <img className=" rounded-2xl" src={logo} alt="my pic" />
              </div>
              <div>
                <p className="font-black text-white text-xl uppercase tracking-tight leading-none">
                  Okie Dokie
                </p>
                <p className="text-white/55 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                  Hostel Management
                </p>
              </div>
            </div>

            {/* Big heading */}
            <div className="flex-1">
              <p className="text-white/45 text-[9px] font-black uppercase tracking-[0.25em] mb-4">
                Student Portal
              </p>
              <h1
                className="font-black leading-[0.9] tracking-tighter text-white mb-8"
                style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)" }}
              >
                Hostel Room
                <br />
                <span
                  className="text-white/40"
                  style={{
                    WebkitTextStroke: "1.5px rgba(255,255,255,0.55)",
                    color: "transparent",
                  }}
                >
                  Booking.
                </span>
              </h1>
              <p className="text-white/55 text-xs font-semibold leading-relaxed">
                Choose your wing, category, and bed — then submit for Warden
                review.
              </p>

              {/* Step tracker */}
              <div className="mt-10 space-y-2.5">
                {[
                  "Choose Wing & Type",
                  "Pick Your Room",
                  "Select a Bed",
                  "Submit Request",
                ].map((step, i) => {
                  const done = i < filledCount;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all
                        ${done ? "bg-white text-orange-500 shadow-md" : "bg-white/15 text-white/40"}`}
                      >
                        {done ? <Icon.Check /> : i + 1}
                      </div>
                      <span
                        className={`text-xs font-bold transition-all ${done ? "text-white" : "text-white/35"}`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/15 pt-5 mt-6">
              <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest">
                © 2024 Okie Dokie
              </p>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-12 max-w-3xl w-full mx-auto">
            {/* Page title */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Room Allocation
              </h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">
                {erpHostelAssigned
                  ? "Your hostel has already been assigned in the system."
                  : "Fill in the form below to request a hostel room."}
              </p>
            </div>

            {/* Student Profile Card - Always visible after login */}
            {student && (
              <div className="mb-8 p-6 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div 
                    className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-orange-200"
                    style={{ background: ACCENT }}
                  >
                    {student.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {student.name}
                      </h3>
                      <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                        {student.regNo || student.rollNo}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-2 text-sm font-bold text-slate-500">
                      <span className="flex items-center gap-2">
                        <span className="text-orange-500">📚</span> {student.course}
                      </span>
                      {student.stream && (
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500">🎯</span> {student.stream}
                        </span>
                      )}
                    </div>
                    {(student.batch || student.section || student.phone) && (
                      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-4">
                        {student.batch && (
                          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Batch: {student.batch}
                          </span>
                        )}
                        {student.section && (
                          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Section: {student.section}
                          </span>
                        )}
                        {student.phone && (
                          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            📞 {student.phone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── ERP Already Assigned card ── */}
            {erpHostelAssigned && erpHostelData ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-emerald-600 flex items-center gap-3">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-widest">
                      Hostel Allocated
                    </p>
                    <p className="text-emerald-200 text-[10px] font-semibold mt-0.5">
                      Assigned in ERP · No further applications required
                    </p>
                  </div>
                </div>
                {/* Details grid */}
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Hostel / Wing", value: erpHostelData.hostel },
                    { label: "Room Type", value: erpHostelData.roomType },
                    { label: "Room No", value: erpHostelData.roomNo },
                    { label: "Bed", value: erpHostelData.bedNo },
                  ].filter(i => i.value).map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {label}
                      </p>
                      <p className="text-base font-black text-slate-800">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-5">
                  <p className="text-xs text-emerald-700 font-semibold">
                    ✓ This allocation is confirmed. Please contact the warden for any changes.
                  </p>
                </div>
              </div>
            ) : (
              <>

                {/* Status alert — inline, below title */}
                {localStatus && (
                  <div
                    className="mb-6 rounded-2xl px-5 py-4 flex items-start gap-4 border"
                    style={{
                      background:
                        localStatus === "approved" || localStatus === "assigned"
                          ? "#f0fdf4"
                          : localStatus === "rejected"
                            ? "#fff1f2"
                            : localStatus === "reapplying"
                              ? "#eff6ff"
                              : "#fffbeb",
                      borderColor:
                        localStatus === "approved" || localStatus === "assigned"
                          ? "#bbf7d0"
                          : localStatus === "rejected"
                            ? "#fecdd3"
                            : localStatus === "reapplying"
                              ? "#bfdbfe"
                              : "#fde68a",
                    }}
                  >
                    <span className="text-2xl flex-shrink-0 mt-0.5">
                      {localStatus === "approved" || localStatus === "assigned"
                        ? "🎉"
                        : localStatus === "rejected"
                          ? "❌"
                          : localStatus === "reapplying"
                            ? "📝"
                            : "⏳"}
                    </span>
                    <div>
                      <p
                        className="text-sm font-black uppercase tracking-wide"
                        style={{
                          color:
                            localStatus === "approved" || localStatus === "assigned"
                              ? "#15803d"
                              : localStatus === "rejected"
                                ? "#be123c"
                                : localStatus === "reapplying"
                                  ? "#1d4ed8"
                                  : "#92400e",
                        }}
                      >
                        {localStatus === "approved" || localStatus === "assigned"
                          ? "Room Approved by Warden!"
                          : localStatus === "rejected"
                            ? "Application Rejected by Warden"
                            : localStatus === "reapplying"
                              ? "Re-applying Application"
                              : localStatus === "reapplied"
                                ? "Application Re-applied! Pending Review"
                                : "Pending Warden Approval"}
                      </p>
                      {localStatus === "rejected" && rejectRemark && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          Reason: {rejectRemark}
                        </p>
                      )}
                      {localStatus === "reapplying" && (
                        <p className="text-xs text-blue-700 font-medium mt-0.5 opacity-75">
                          Please update your details and submit again
                        </p>
                      )}
                      {(localStatus === "pending" || localStatus === "reapplied") && (
                        <p className="text-xs text-amber-700 font-medium mt-0.5 opacity-75">
                          No changes allowed until reviewed
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Completion
                    </span>
                    <span
                      className="text-[11px] font-black"
                      style={{ color: ACCENT }}
                    >
                      {filledCount}/{fields.length} Fields
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${progressPct}%`,
                        background: `linear-gradient(90deg, rgb(237,128,65), rgb(255,160,90))`,
                      }}
                    />
                  </div>
                </div>

                {/* Student card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-2xl"
                    style={{ background: ACCENT }}
                  />
                  <div className="flex items-center gap-4 w-full md:w-auto ml-1">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                      {student?.photo ? (
                        <img
                          src={student.photo}
                          className="w-full h-full object-cover"
                          alt="student"
                        />
                      ) : (
                        "🙎‍♂️"
                      )}
                    </div>
                    <div className="flex-1 min-w-0 md:hidden">
                      <p className="font-black text-slate-900 text-base truncate">
                        {student?.name || "Student Profile"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {student?.regNo || effectiveRegNo}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className="hidden md:block">
                      <p className="font-black text-slate-900 text-base truncate">
                        {student?.name || "Student Profile"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {student?.regNo || effectiveRegNo}
                      </p>
                      {(student?.course || student?.stream) && (
                        <p className="text-[11px] text-slate-500 font-semibold mt-1 truncate">
                          {student.course} • {student.stream}
                        </p>
                      )}
                      {(student?.batch || student?.section) && (
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          Batch: {student.batch} | Sec: {student.section}
                        </p>
                      )}
                    </div>
                    <div className="md:hidden">
                      {(student?.course || student?.stream) && (
                        <p className="text-[11px] text-slate-500 font-semibold mt-1 truncate">
                          {student.course} • {student.stream}
                        </p>
                      )}
                      {(student?.batch || student?.section) && (
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          Batch: {student.batch} | Sec: {student.section}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col justify-center md:items-end gap-1.5 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-none">
                      {student?.phone && (
                        <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-2">
                          <span className="text-sm">📞</span> {student.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {localStatus && (
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        style={{
                          background:
                            localStatus === "rejected"
                              ? "#fee2e2"
                              : localStatus === "approved" ||
                                localStatus === "assigned"
                                ? "#ecfdf5"
                                : ACCENT_LIGHT,
                          color:
                            localStatus === "rejected"
                              ? "#dc2626"
                              : localStatus === "approved" ||
                                localStatus === "assigned"
                                ? "#059669"
                                : ACCENT,
                        }}
                      >
                        {localStatus === "assigned"
                          ? "approved"
                          : localStatus === "pending"
                            ? "under review"
                            : localStatus}
                      </span>
                      {localStatus === "rejected" && rejectRemark && (
                        <span className="text-[10px] text-red-500 font-bold text-right max-w-[160px] leading-tight">
                          {rejectRemark}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {fields.map((field) => {
                    const meta = FIELD_META[field.name] || {
                      icon: Icon.Hash,
                      color: "#64748b",
                    };
                    const FieldIcon = meta.icon;
                    const val = (form as any)[field.name];
                    const filled = !!val;
                    return (
                      <div key={field.name}>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                          <span style={{ color: meta.color }}>
                            <FieldIcon />
                          </span>
                          {field.label}
                        </label>
                        <div className="relative">
                          <select
                            name={field.name}
                            value={val}
                            onChange={handleChange}
                            disabled={isLocked}
                            className="w-full appearance-none rounded-xl pr-10 outline-none transition-all duration-200 text-sm font-bold text-slate-800"
                            style={{
                              padding: "0.875rem 2.5rem 0.875rem 1rem",
                              background: filled ? "#fff" : "#f8fafc",
                              border: filled
                                ? `2px solid ${ACCENT}`
                                : "2px solid #e2e8f0",
                              boxShadow: filled
                                ? `0 4px 20px rgba(237,128,65,0.12)`
                                : "none",
                              opacity: isLocked ? 0.65 : 1,
                              cursor: isLocked ? "not-allowed" : "pointer",
                            }}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                            {filled && (
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ background: ACCENT }}
                              />
                            )}
                            <span className="text-slate-400">
                              <Icon.ChevronDown />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Remark field — optional */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                    <span style={{ color: "#94a3b8" }}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </span>
                    Remark
                    <span className="text-slate-300 font-semibold normal-case tracking-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    name="remark"
                    value={form.remark}
                    onChange={handleChange as any}
                    disabled={isLocked}
                    placeholder="Add remark..."
                    rows={2}
                    className="w-full rounded-xl outline-none resize-none text-sm font-semibold text-slate-800 transition-all duration-200"
                    style={{
                      padding: "0.875rem 1rem",
                      background: form.remark ? "#fff" : "#f8fafc",
                      border: form.remark
                        ? `2px solid ${ACCENT}`
                        : "2px solid #e2e8f0",
                      boxShadow: form.remark
                        ? `0 4px 20px rgba(237,128,65,0.12)`
                        : "none",
                      opacity: isLocked ? 0.65 : 1,
                      cursor: isLocked ? "not-allowed" : "text",
                    }}
                  />
                </div>
                {form.hostel && form.roomType && (
                  <div
                    className="mb-6 rounded-2xl p-4 border"
                    style={{ background: ACCENT_LIGHT, borderColor: ACCENT_MID }}
                  >
                    <p
                      className="text-[9px] font-black uppercase tracking-widest mb-3"
                      style={{ color: ACCENT }}
                    >
                      ✦ Your Selection
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Wing", value: form.hostel },
                        { label: "Type", value: form.roomType },
                        ...(form.roomNo
                          ? [{ label: "Room", value: form.roomNo }]
                          : []),
                        ...(form.bedNo
                          ? [{ label: "Bed", value: form.bedNo }]
                          : []),
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-white rounded-xl px-3.5 py-2 border border-orange-100 shadow-sm"
                        >
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            {item.label}
                          </p>
                          <p className="text-sm font-black text-slate-800">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA button */}
                {localStatus === "rejected" && !hasReapplied ? (
                  <button
                    onClick={() => {
                      setLocalStatus("reapplying");
                      setForm((prev) => ({
                        ...prev,
                        hostel: "",
                        roomType: "",
                        roomNo: "",
                        bedNo: "",
                        remark: "",
                      }));
                    }}
                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 relative overflow-hidden transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, rgb(237,128,65), rgb(255,150,75))`,
                      color: "white",
                      boxShadow: `0 8px 32px rgba(237,128,65,0.38)`,
                    }}
                  >
                    <span>Re-apply as New</span>
                    <Icon.Arrow />
                  </button>
                ) : (
                  <button
                    onClick={validateAndShowConfirm}
                    disabled={isLocked || loading}
                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 relative overflow-hidden transition-all duration-200"
                    style={{
                      background: isLocked
                        ? "#f1f5f9"
                        : `linear-gradient(135deg, rgb(237,128,65), rgb(255,150,75))`,
                      color: isLocked ? "#94a3b8" : "white",
                      boxShadow: isLocked
                        ? "none"
                        : `0 8px 32px rgba(237,128,65,0.38)`,
                      cursor: isLocked ? "not-allowed" : "pointer",
                      transform: "translateY(0)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLocked)
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(0)";
                    }}
                  >
                    {isLocked ? (
                      <>
                        <Icon.Lock />
                        <span>
                          Application{" "}
                          {localStatus === "approved" || localStatus === "assigned"
                            ? "Finalized"
                            : localStatus === "rejected"
                              ? "Rejected Permanently"
                              : "Under Review"}
                        </span>
                      </>
                    ) : loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Request Allocation</span>
                        <Icon.Arrow />
                      </>
                    )}
                  </button>
                )}

                <p className="text-center text-[10px] text-slate-400 font-medium mt-4 leading-relaxed">
                  Subject to Warden approval · Cannot be modified after submission
                </p>
              </>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50% { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        select option { font-weight: 600; }
        select:focus {
          border-color: rgb(237,128,65) !important;
          box-shadow: 0 0 0 3px rgba(237,128,65,0.15) !important;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 8px; }
      `}</style>
    </div>
  );
}
