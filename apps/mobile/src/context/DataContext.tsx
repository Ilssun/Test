import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  Category,
  Session,
  Group,
  LogEntry,
  AppUser,
  listCategories,
  listSessions,
  listGroups,
  listLogEntries,
  getAllUsers,
} from "@carnet/core";
import { useAuth } from "./AuthContext";

interface DataContextValue {
  categories: Category[];
  sessions: Session[];
  groups: Group[];
  logEntries: LogEntry[];
  users: AppUser[];
  loaded: boolean;
  refreshAll: () => Promise<void>;
  refreshLogEntries: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { me } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refreshCategories = useCallback(async () => setCategories(await listCategories()), []);
  const refreshSessions = useCallback(async () => setSessions(await listSessions()), []);
  const refreshGroups = useCallback(async () => setGroups(await listGroups()), []);
  const refreshLogEntries = useCallback(async () => setLogEntries(await listLogEntries()), []);
  const refreshUsers = useCallback(async () => setUsers(await getAllUsers()), []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshCategories(),
      refreshSessions(),
      refreshGroups(),
      refreshLogEntries(),
      refreshUsers(),
    ]);
    setLoaded(true);
  }, [refreshCategories, refreshSessions, refreshGroups, refreshLogEntries, refreshUsers]);

  useEffect(() => {
    if (me) refreshAll();
  }, [me, refreshAll]);

  return (
    <DataContext.Provider
      value={{
        categories,
        sessions,
        groups,
        logEntries,
        users,
        loaded,
        refreshAll,
        refreshLogEntries,
        refreshCategories,
        refreshSessions,
        refreshGroups,
        refreshUsers,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
