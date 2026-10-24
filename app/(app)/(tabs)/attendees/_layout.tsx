import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

// When another screen links straight into this tab (e.g. Home's "Previous
// events" button), put the live list underneath so Back returns to it.
export const unstable_settings = { initialRouteName: "index" };

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
