import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export default function AppStack() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="announcement-editor"
        options={{ presentation: "modal", title: "Announcement" }}
      />
      <Stack.Screen name="event-editor" options={{ presentation: "modal", title: "Itinerary item" }} />
      <Stack.Screen
        name="question-editor"
        options={{ presentation: "modal", title: "Profile question" }}
      />
      <Stack.Screen
        name="manage-profile"
        options={{ title: "Manage profile", headerBackTitle: "Back" }}
      />
    </Stack>
  );
}
