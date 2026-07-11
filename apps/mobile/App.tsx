import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, BigShouldersDisplay_700Bold, BigShouldersDisplay_800ExtraBold } from "@expo-google-fonts/big-shoulders-display";
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from "@expo-google-fonts/ibm-plex-mono";
import { Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold } from "@expo-google-fonts/archivo";
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
  const [fontsLoaded] = useFonts({
    BigShouldersDisplay_700Bold,
    BigShouldersDisplay_800ExtraBold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Ouverture du carnet…</Text>
      </View>
    );
  }

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
