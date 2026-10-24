import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export default function AttendeesStack() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerTitle: "",
        headerBackTitle: "Attendees",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
