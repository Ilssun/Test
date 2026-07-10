import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { DataProvider } from "./src/context/DataContext";
import AuthScreen from "./src/screens/AuthScreen";
import RootNavigator from "./src/navigation";
import { colors } from "./src/theme";

function Gate() {
  const { me, authChecked } = useAuth();
  if (!authChecked) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Ouverture du carnet…</Text>
      </View>
    );
  }
  if (!me) return <AuthScreen />;
  return (
    <DataProvider>
      <RootNavigator />
    </DataProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Gate />
      </AuthProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
});
