export type Role = 'CITIZEN' | 'OFFICER' | 'DEPT_HEAD' | 'ADMIN';
export type ComplaintStatus = string;
export type SeverityLevel = string;

export interface User {
  id: string;
  username: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Officer {
  id: string;
  username: string;
  name: string;
  role: string;
  status: string;
  departmentId: string;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  id: string;
  url: string;
  complaintId: string;
}

export interface AIAnalysisResult {
  id: string;
  complaintId: string;
  category: string;
  severity: SeverityLevel;
  department: string;
  subcategory: string;
  detectedCategory: string;
  detectedSeverity: string;
  confidenceScore: number;
  confidence?: number;
  summary: string;
  tags: string | string[];
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  complaintId: string;
  previousStatus: string;
  newStatus: string;
  remarks?: string | null;
  changedById: string;
  changedByType: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  complaintId?: string | null;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  severity: string;
  userId: string;
  user?: User;
  departmentId?: string | null;
  department?: Department | null;
  officerId?: string | null;
  officer?: Officer | null;
  images?: Image[];
  imageUrl?: string | null;
  aiAnalysis?: AIAnalysisResult | null;
  aiConfidence?: number | null;
  aiSummary?: string | null;
  statusHistory?: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  userId?: string | null;
  officerId?: string | null;
  createdAt: string;
}
