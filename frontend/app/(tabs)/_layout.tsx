import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { ChildProvider } from "../../src/ChildContext";

export default function TabsLayout() {
  return (
    <ChildProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.ink,
          tabBarInactiveTintColor: theme.subtle,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: theme.line,
            borderTopWidth: 1,
            height: 70,
            paddingTop: 8,
            paddingBottom: 14,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="location"
          options={{
            title: "Localização",
            tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="apps"
          options={{
            title: "Apps",
            tabBarIcon: ({ color, size }) => <Ionicons name="apps-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alertas",
            tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Ajustes",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
    </ChildProvider>
  );
}
