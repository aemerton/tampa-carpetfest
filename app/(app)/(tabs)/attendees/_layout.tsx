import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export default function AttendeesStack() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        headerTitle: "",
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="previous" options={{ headerTitle: "Previous events" }} />
      <Stack.Screen name="event/[eventId]" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
