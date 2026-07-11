export type Role = "admin" | "member";
export type Status = "pending" | "active";

export interface AppUser {
  id: string;
  username: string;
  usernameLower: string;
  email: string; // synthetic email used for Firebase Auth (username@carnet.local)
  role: Role;
  status: Status;
  groupId: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  createdAt: number;
}

// Groups sessions in the catalog (e.g. "Cardio", "Renfo").
export interface Category {
  id: string;
  name: string;
  createdAt: number;
}

export interface Document {
  name: string;
  path: string; // Firebase Storage path
  url: string; // download URL
}

// A catalog entry a member picks when logging a séance.
export interface Session {
  id: string;
  name: string;
  desc: string;
  details: string;
  document?: Document | null;
  catId: string; // "" = uncategorized, else a Category id
  createdAt: number;
}

export interface LogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sessionId: string;
  sessionName: string;
  rating?: number; // 1-5, optional
  comment?: string;
  userId: string;
  userName: string;
  groupId: string;
  createdAt: number;
}
