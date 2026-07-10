import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

type Kind = "ok" | "err";
interface Toast { msg: string; kind: Kind }

const ToastContext = createContext<(msg: string, kind?: Kind) => void>(() => {});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((msg: string, kind: Kind = "ok") => {
    setToast({ msg, kind });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <View style={[styles.toast, toast.kind === "ok" ? styles.ok : styles.err]}>
          <Text style={[styles.text, toast.kind === "ok" ? styles.okText : styles.errText]}>{toast.msg}</Text>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: "10%",
    right: "10%",
    bottom: 32,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  ok: { backgroundColor: colors.sheet, borderWidth: 2, borderColor: colors.red },
  err: { backgroundColor: colors.text },
  text: { fontWeight: "600", fontSize: 13.5 },
  okText: { color: colors.red },
  errText: { color: "#fff" },
});
