import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EventList } from "@/components/EventList";
import { LogoSettings } from "@/components/LogoSettings";
import { Button, Card, ErrorText, Header, Loading, Muted, SectionTitle } from "@/components/ui";
import { useIsAdmin } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";
import type { CarpetEvent } from "@/lib/types";

export default function ManageEvents() {
  const isAdmin = useIsAdmin();
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const events = data as CarpetEvent[];
    return {
      active: events.find((e) => e.status === "active") ?? null,
      past: events
        .filter((e) => e.status === "closed")
        .sort((a, b) => (b.closed_at ?? "").localeCompare(a.closed_at ?? "")),
    };
  });

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.fill} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Muted>Only event admins can manage events.</Muted>
        </ScrollView>
      </SafeAreaView>
    );
  }
  if (!data && !error) return <Loading />;

  return (
    <SafeAreaView style={styles.fill} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <Header title="Manage Event" logoSize={72} />
        <ErrorText>{error}</ErrorText>

        <SectionTitle>Current event</SectionTitle>
        {data?.active ? (
          <EventList
            events={[data.active]}
            onPress={(e) => router.push(`/manage/${e.id}`)}
          />
        ) : (
          <Card>
            <Muted>
              No active event. Create the next one when you're ready. Only one event can be
              active at a time.
            </Muted>
            <Button title="+ Create event" onPress={() => router.push("/manage/event-form")} />
          </Card>
        )}

        <SectionTitle>Past events</SectionTitle>
        <EventList
          events={data?.past ?? []}
          emptyText="No past events yet."
          onPress={(e) => router.push(`/manage/${e.id}`)}
        />

        <SectionTitle>App settings</SectionTitle>
        <Pressable
          onPress={() => router.push("/manage/questions")}
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="chatbubbles" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.linkLabel}>Profile questions</Text>
            <Muted>Add, edit, reorder, or hide the "Get to know you" questions</Muted>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <LogoSettings />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  linkLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
  fill: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
});
