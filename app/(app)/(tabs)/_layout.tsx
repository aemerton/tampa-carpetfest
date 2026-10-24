import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useIsAdmin } from "@/lib/auth";
import { colors } from "@/lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function icon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function AppTabs() {
  const isAdmin = useIsAdmin();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home") }} />
      <Tabs.Screen
        name="itinerary"
        options={{ title: "Itinerary", tabBarIcon: icon("calendar") }}
      />
      <Tabs.Screen
        name="attendees"
        // Leaving the tab resets it, so coming back always shows the live list
        // rather than whatever past-event screen was open last.
        options={{ title: "Attendees", tabBarIcon: icon("people"), popToTopOnBlur: true }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: "My Profile", tabBarIcon: icon("person-circle") }}
      />
      {/* Admins only; hidden from everyone else's tab bar. */}
      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage Event",
          tabBarIcon: icon("settings"),
          href: isAdmin ? undefined : null,
          popToTopOnBlur: true,
        }}
      />
    </Tabs>
  );
}
