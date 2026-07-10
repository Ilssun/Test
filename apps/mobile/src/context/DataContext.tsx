import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  Category,
  Account,
  Group,
  Transaction,
  AppUser,
  listCategories,
  listAccounts,
  listGroups,
  listTransactions,
  getAllUsers,
} from "@carnet/core";
import { useAuth } from "./AuthContext";

interface DataContextValue {
  categories: Category[];
  accounts: Account[];
  groups: Group[];
  transactions: Transaction[];
  users: AppUser[];
  loaded: boolean;
  refreshAll: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { me } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refreshCategories = useCallback(async () => setCategories(await listCategories()), []);
  const refreshAccounts = useCallback(async () => setAccounts(await listAccounts()), []);
  const refreshGroups = useCallback(async () => setGroups(await listGroups()), []);
  const refreshTransactions = useCallback(async () => setTransactions(await listTransactions()), []);
  const refreshUsers = useCallback(async () => setUsers(await getAllUsers()), []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCategories(), refreshAccounts(), refreshGroups(), refreshTransactions(), refreshUsers()]);
    setLoaded(true);
  }, [refreshCategories, refreshAccounts, refreshGroups, refreshTransactions, refreshUsers]);

  useEffect(() => {
    if (me) refreshAll();
  }, [me, refreshAll]);

  return (
    <DataContext.Provider
      value={{
        categories,
        accounts,
        groups,
        transactions,
        users,
        loaded,
        refreshAll,
        refreshTransactions,
        refreshCategories,
        refreshAccounts,
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
