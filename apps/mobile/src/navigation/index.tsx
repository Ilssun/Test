import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import TransactionScreen from "../screens/TransactionScreen";
import HistoryScreen from "../screens/HistoryScreen";
import MembersScreen from "../screens/MembersScreen";
import AdminScreen from "../screens/AdminScreen";
import AccountScreen from "../screens/AccountScreen";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

const tabIcon = (emoji: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 18 }}>{emoji}</Text>;

export default function RootNavigator() {
  const { me } = useAuth();
  const isAdmin = me?.role === "admin";

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.blue,
          tabBarInactiveTintColor: colors.muted,
          headerStyle: { backgroundColor: colors.sheet },
          headerTitleStyle: { color: colors.text },
          tabBarStyle: { backgroundColor: colors.sheet },
        }}
      >
        <Tab.Screen
          name="Écriture"
          component={TransactionScreen}
          options={{ title: "Ma transaction", tabBarIcon: tabIcon("💶") }}
        />
        <Tab.Screen
          name="Historique"
          component={HistoryScreen}
          options={{ tabBarIcon: tabIcon("📊") }}
        />
        {isAdmin && (
          <Tab.Screen name="Membres" component={MembersScreen} options={{ tabBarIcon: tabIcon("👥") }} />
        )}
        {isAdmin && (
          <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarIcon: tabIcon("⚙️") }} />
        )}
        <Tab.Screen
          name="Mon compte"
          component={AccountScreen}
          options={{ tabBarIcon: tabIcon("👤") }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
