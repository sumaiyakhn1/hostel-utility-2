import axios from "axios";

const BASE_URL = "https://admission-api.odpay.in";

const api = axios.create({
  baseURL: BASE_URL,
});

// Local/Deployed Backend API for MongoDB saving
const localApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "https://hostel-dashboard-af3s.onrender.com",
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = token;
      }
    } catch (e) {
      console.warn("localStorage access denied", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

localApi.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = token;
      }
    } catch (e) {
      console.warn("localStorage access denied", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const hostelService = {
  login: async () => {
    const mobile = "2233445577";
    const password = "2233445577";
    const response = await api.post("/login", { mobile, password });
    return response.data;
  },

  sendOTP: async (mobile: string) => {
    const response = await api.get(`/api/sendLogin/otp`, {
      params: { mobile },
    });
    return response.data;
  },

  verifyOTP: async (mobile: string, otp: string) => {
    const response = await api.get(`/api/verify/otp`, {
      params: { mobile, otp, source: "erp" },
    });
    return response.data;
  },

  getHostelMaster: async (entityId: string) => {
    const response = await api.get(`/api/view/hostelMaster`, {
      params: { entity: entityId },
    });
    return response.data;
  },

  getHostelRooms: async (params: {
    entity: string;
    session: string;
    hostel: string;
    roomType: string;
  }) => {
    const response = await api.get(`/api/list/hostelRoom`, { params });
    return response.data;
  },

  getStudentDetails: async (params: {
    id: string;
    entity: string;
    session: string;
    regNo: string;
  }) => {
    const response = await api.get(`/api/view/student`, { params });
    return response.data;
  },

  assignHostelRoom: async (payload: any) => {
    const response = await api.post(`/api/assignToStudent/hostelRoom`, payload);
    return response.data;
  },

  // Save student data to local MongoDB
  saveStudentToDB: async (
    regNumber: string,
    data: any,
  ) => {
    const response = await localApi.post(`/api/students/${regNumber}`, data);
    return response.data;
  },

  getAllSavedStudents: async () => {
    const response = await localApi.get(`/api/students`);
    return response.data;
  },

  updateStudentInDB: async (regNumber: string, data: any) => {
    const response = await localApi.patch(`/api/students/${regNumber}`, data);
    return response.data;
  },

  getStudentFromDB: async (regNumber: string) => {
    const response = await localApi.get(`/api/students/${regNumber}`);
    return response.data;
  },

  // Hold Room management
  getHeldRooms: async () => {
    const response = await localApi.get(`/api/held-rooms`);
    return response.data;
  },

  holdRoom: async (roomName: string, bedName: string) => {
    const response = await localApi.post(`/api/held-rooms`, { roomName, bedName });
    return response.data;
  },

  unholdRoom: async (roomName: string, bedName: string) => {
    const response = await localApi.delete(`/api/held-rooms/${encodeURIComponent(roomName)}/${encodeURIComponent(bedName)}`);
    return response.data;
  },

  // Reports
  getStudentReports: async (payload: any) => {
    const response = await api.post(`/api/hostelReport/studentReports`, payload);
    return response.data;
  },

  removeFromStudentHostelRoom: async (studentId: string, remark: string, installments: string[]) => {
    const payload = { studentId, remark, installments };
    const response = await api.post(`https://fee2-api.odpay.in/api/removeFromStudent/hostelRoom?studentId`, payload);
    return response.data;
  }
};
