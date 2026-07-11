import { AppUser, Transaction } from "./types";

export const visibleTransactions = (
  all: Transaction[],
  users: AppUser[],
  me: AppUser,
  groupFilter: string | null // null = all groups (admin only), "" = no group, else groupId
): Transaction[] => {
  const isAdmin = me.role === "admin";
  const target = isAdmin ? groupFilter : me.groupId || "";
  if (target === null) return all;
  return all.filter((t) => {
    const owner = users.find((u) => u.id === t.userId);
    const g = owner ? owner.groupId || "" : t.groupId || "";
    return g === target;
  });
};

export const totals = (list: Transaction[]) => {
  const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
};

export const byCategory = (list: Transaction[]) => {
  const map = new Map<string, { name: string; income: number; expense: number }>();
  for (const t of list) {
    const cur = map.get(t.categoryId) || { name: t.categoryName, income: 0, expense: 0 };
    if (t.type === "income") cur.income += t.amount;
    else cur.expense += t.amount;
    map.set(t.categoryId, cur);
  }
  return [...map.values()].sort((a, b) => b.income + b.expense - (a.income + a.expense));
};

export const byAccount = (list: Transaction[]) => {
  const map = new Map<string, { name: string; balance: number }>();
  for (const t of list) {
    const cur = map.get(t.accountId) || { name: t.accountName, balance: 0 };
    cur.balance += t.type === "income" ? t.amount : -t.amount;
    map.set(t.accountId, cur);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
};

// Ranks members by number of écritures logged — mirrors the original app's
// leaderboard of who validated the most séances.
export const leaderboard = (list: Transaction[]) => {
  const map = new Map<string, { name: string; count: number }>();
  for (const t of list) {
    const cur = map.get(t.userId) || { name: t.userName, count: 0 };
    cur.count += 1;
    map.set(t.userId, cur);
  }
  return [...map.values()].filter((x) => x.count > 0).sort((a, b) => b.count - a.count);
};

export const favoriteCategory = (list: Transaction[]) => {
  const counts = new Map<string, number>();
  for (const t of list) counts.set(t.categoryName, (counts.get(t.categoryName) || 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : "—";
};

export const groupByDate = (list: Transaction[]) => {
  const map = new Map<string, Transaction[]>();
  for (const t of list) {
    if (!map.has(t.date)) map.set(t.date, []);
    map.get(t.date)!.push(t);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, txs]) => [date, txs.sort((a, b) => b.createdAt - a.createdAt)] as const);
};
