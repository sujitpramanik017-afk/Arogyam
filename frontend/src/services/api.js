const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sanaka_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('sanaka_token');
    localStorage.removeItem('sanaka_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errJson = await response.json();
      if (typeof errJson.detail === 'string') {
        errorMsg = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        errorMsg = errJson.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else if (errJson.message) {
        errorMsg = errJson.message;
      } else {
        errorMsg = JSON.stringify(errJson);
      }
    } catch {
      errorMsg = response.statusText || 'Server response error';
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request('/auth/me'),

  // Patients
  getPatients: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search && params.search.trim()) query.append('search', params.search.trim());
    if (params.gender && params.gender !== 'All') query.append('gender', params.gender);
    if (params.blood_group && params.blood_group !== 'All') query.append('blood_group', params.blood_group);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    const qs = query.toString();
    return request(`/patients${qs ? `?${qs}` : ''}`);
  },
  getPatient: (id) => request(`/patients/${id}`),
  getNextPatientId: () => request('/patients/next-id'),
  createPatient: (data) =>
    request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePatient: (id, data) =>
    request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePatient: (id) =>
    request(`/patients/${id}`, {
      method: 'DELETE',
    }),

  // Cases
  getCases: (params = {}) => {
    const query = new URLSearchParams();
    if (params.patient_id) query.append('patient_id', params.patient_id);
    if (params.doctor_id && params.doctor_id !== 'undefined' && params.doctor_id !== 'null') query.append('doctor_id', params.doctor_id);
    if (params.department_id && params.department_id !== 'undefined' && params.department_id !== 'null') query.append('department_id', params.department_id);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return request(`/cases${qs ? `?${qs}` : ''}`);
  },
  getCase: (id) => request(`/cases/${id}`),
  createCase: (data) =>
    request('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCase: (id, data) =>
    request(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Appointments
  getAppointments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.date && params.date !== 'All') query.append('date', params.date);
    if (params.doctor_id && params.doctor_id !== 'undefined' && params.doctor_id !== 'null') query.append('doctor_id', params.doctor_id);
    if (params.department_id && params.department_id !== 'undefined' && params.department_id !== 'null') query.append('department_id', params.department_id);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return request(`/appointments${qs ? `?${qs}` : ''}`);
  },
  createAppointment: (data) =>
    request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAppointmentStatus: (id, status) =>
    request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Prescriptions
  getPrescriptions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.patient_id) query.append('patient_id', params.patient_id);
    if (params.doctor_id && params.doctor_id !== 'undefined' && params.doctor_id !== 'null') query.append('doctor_id', params.doctor_id);
    const qs = query.toString();
    return request(`/prescriptions${qs ? `?${qs}` : ''}`);
  },
  getPrescription: (id) => request(`/prescriptions/${id}`),

  // Doctors & Medical Staff
  getDoctors: (params = {}) => {
    const query = new URLSearchParams();
    if (params.department_id && params.department_id !== 'undefined' && params.department_id !== 'null') query.append('department_id', params.department_id);
    if (params.available_only) query.append('available_only', 'true');
    const qs = query.toString();
    return request(`/doctors${qs ? `?${qs}` : ''}`);
  },
  getDoctor: (id) => request(`/doctors/${id}`),
  createDoctor: (data) =>
    request('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDoctor: (id, data) =>
    request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDoctor: (id) =>
    request(`/doctors/${id}`, {
      method: 'DELETE',
    }),
  getStaff: (role) => request(`/admin/staff${role && role !== 'All' ? `?role=${role}` : ''}`),
  createStaff: (data) =>
    request('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStaff: (id, data) =>
    request(`/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteStaff: (id) =>
    request(`/admin/staff/${id}`, {
      method: 'DELETE',
    }),

  // Departments
  getDepartments: () => request('/departments'),
  createDepartment: (data) =>
    request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // AI Assistant
  aiSummarize: (case_data) =>
    request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ case_data }),
    }),
  aiMissingInfo: (case_data) =>
    request('/ai/missing-info', {
      method: 'POST',
      body: JSON.stringify({ case_data }),
    }),
  aiFormatNotes: (raw_notes) =>
    request('/ai/format-notes', {
      method: 'POST',
      body: JSON.stringify({ raw_notes }),
    }),
  arogyaChat: (message, language = 'auto') =>
    request('/ai/arogya-chat', {
      method: 'POST',
      body: JSON.stringify({ message, language }),
    }),

  // Admin & Analytics
  getDashboardStats: () => request('/admin/stats'),
  getAuditLogs: (limit = 100) => request(`/admin/audit-logs?limit=${limit}`),

  // Public Patient Self-Service Portal
  patientSelfBook: (data) =>
    request('/patient-portal/book-appointment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  patientLookupRecords: (identifier) =>
    request('/patient-portal/my-records', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),
};
