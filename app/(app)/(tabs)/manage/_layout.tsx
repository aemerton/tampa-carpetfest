import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export const unstable_settings = { initialRouteName: "index" };

export default function ManageStack() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="event-form" options={{ title: "Event details" }} />
      <Stack.Screen name="[eventId]/index" options={{ title: "Manage event" }} />
      <Stack.Screen name="[eventId]/itinerary" options={{ title: "Itinerary" }} />
      <Stack.Screen name="[eventId]/announcements" options={{ title: "Announcements" }} />
      <Stack.Screen name="[eventId]/attendees" options={{ title: "Attendee list" }} />
    </Stack>
  );
}
