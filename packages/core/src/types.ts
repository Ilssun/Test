export type Role = "admin" | "member";
export type Status = "pending" | "active";
export type CategoryType = "income" | "expense";

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

// Groups categories in the catalog (e.g. "Revenus", "Dépenses fixes") — purely
// organizational, distinct from `Group` (member teams like "Équipe du mardi").
export interface CategoryGroup {
  id: string;
  name: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  desc: string;
  details: string; // optional long-form notes shown when picked (e.g. instructions, context)
  document?: Receipt | null; // optional attached reference document (contract, invoice template...)
  groupId: string; // "" = ungrouped, else a CategoryGroup id
  createdAt: number;
}

export interface Account {
  id: string;
  name: string;
  desc: string;
  createdAt: number;
}

export interface Receipt {
  name: string;
  path: string; // Firebase Storage path
  url: string; // download URL
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: CategoryType;
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  amount: number; // always positive, sign derived from `type`
  note: string;
  receipt?: Receipt | null;
  userId: string;
  userName: string;
  groupId: string;
  createdAt: number;
}
