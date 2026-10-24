import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function icon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function AppTabs() {
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
        options={{ title: "Attendees", tabBarIcon: icon("people") }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: "My Profile", tabBarIcon: icon("person-circle") }}
      />
    </Tabs>
  );
}
