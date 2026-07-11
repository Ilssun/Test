import { AppUser, LogEntry } from "./types";

export const visibleLogEntries = (
  all: LogEntry[],
  users: AppUser[],
  me: AppUser,
  groupFilter: string | null // null = all groups (admin only), "" = no group, else groupId
): LogEntry[] => {
  const isAdmin = me.role === "admin";
  const target = isAdmin ? groupFilter : me.groupId || "";
  if (target === null) return all;
  return all.filter((e) => {
    const owner = users.find((u) => u.id === e.userId);
    const g = owner ? owner.groupId || "" : e.groupId || "";
    return g === target;
  });
};

// Ranks members by number of séances validated — the original app's leaderboard.
export const leaderboard = (list: LogEntry[]) => {
  const map = new Map<string, { name: string; count: number }>();
  for (const e of list) {
    const cur = map.get(e.userId) || { name: e.userName, count: 0 };
    cur.count += 1;
    map.set(e.userId, cur);
  }
  return [...map.values()].filter((x) => x.count > 0).sort((a, b) => b.count - a.count);
};

export const favoriteSession = (list: LogEntry[]) => {
  const counts = new Map<string, number>();
  for (const e of list) counts.set(e.sessionName, (counts.get(e.sessionName) || 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : "—";
};

export const groupByDate = (list: LogEntry[]) => {
  const map = new Map<string, LogEntry[]>();
  for (const e of list) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, entries]) => [date, entries.sort((a, b) => b.createdAt - a.createdAt)] as const);
};
