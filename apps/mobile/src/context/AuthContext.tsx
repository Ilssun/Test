import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppUser, onAuthChange, getProfile } from "@carnet/core";

interface AuthContextValue {
  me: AppUser | null;
  setMe: (u: AppUser | null) => void;
  authChecked: boolean;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [me, setMe] = useState<AppUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const refreshMe = useCallback(async () => {
    if (!me) return;
    const fresh = await getProfile(me.id);
    if (fresh) setMe(fresh);
  }, [me]);

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      if (fbUser) {
        const profile = await getProfile(fbUser.uid);
        setMe(profile && profile.status === "active" ? profile : null);
      } else {
        setMe(null);
      }
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ me, setMe, authChecked, refreshMe }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
