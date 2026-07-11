import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  Category,
  CategoryGroup,
  Account,
  Group,
  Transaction,
  AppUser,
  listCategories,
  listCategoryGroups,
  listAccounts,
  listGroups,
  listTransactions,
  getAllUsers,
} from "@carnet/core";
import { useAuth } from "./AuthContext";

interface DataContextValue {
  categories: Category[];
  categoryGroups: CategoryGroup[];
  accounts: Account[];
  groups: Group[];
  transactions: Transaction[];
  users: AppUser[];
  loaded: boolean;
  refreshAll: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshCategoryGroups: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { me } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refreshCategories = useCallback(async () => setCategories(await listCategories()), []);
  const refreshCategoryGroups = useCallback(async () => setCategoryGroups(await listCategoryGroups()), []);
  const refreshAccounts = useCallback(async () => setAccounts(await listAccounts()), []);
  const refreshGroups = useCallback(async () => setGroups(await listGroups()), []);
  const refreshTransactions = useCallback(async () => setTransactions(await listTransactions()), []);
  const refreshUsers = useCallback(async () => setUsers(await getAllUsers()), []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshCategories(),
      refreshCategoryGroups(),
      refreshAccounts(),
      refreshGroups(),
      refreshTransactions(),
      refreshUsers(),
    ]);
    setLoaded(true);
  }, [refreshCategories, refreshCategoryGroups, refreshAccounts, refreshGroups, refreshTransactions, refreshUsers]);

  useEffect(() => {
    if (me) refreshAll();
  }, [me, refreshAll]);

  return (
    <DataContext.Provider
      value={{
        categories,
        categoryGroups,
        accounts,
        groups,
        transactions,
        users,
        loaded,
        refreshAll,
        refreshTransactions,
        refreshCategories,
        refreshCategoryGroups,
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
