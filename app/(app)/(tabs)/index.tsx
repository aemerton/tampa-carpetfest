import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PollCard } from "@/components/PollCard";
import { Button, Card, ErrorText, Header, Loading, Muted, SectionTitle } from "@/components/ui";
import { useIsAdmin, useUserId } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { loadActiveEvent } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";
import type { Announcement, Profile } from "@/lib/types";

export default function Home() {
  const userId = useUserId();
  const isAdmin = useIsAdmin();
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const [{ event, registered }, me] = await Promise.all([
      loadActiveEvent(userId),
      supabase
        .from("profiles")
        .select("full_name, photo_url, business_name")
        .eq("id", userId)
        .single(),
    ]);
    if (me.error) throw me.error;

    let announcements: Announcement[] = [];
    if (event && registered) {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      announcements = data as Announcement[];
    }
    return {
      event,
      registered,
      announcements,
      me: me.data as Pick<Profile, "full_name" | "photo_url" | "business_name">,
    };
  }, [userId]);

  if (!data) {
    return error ? (
      <SafeAreaView style={styles.fill} edges={["top"]}>
        <View style={styles.content}>
          <ErrorText>{error}</ErrorText>
        </View>
      </SafeAreaView>
    ) : (
      <Loading />
    );
  }

  const { event, registered, announcements, me } = data;
  const firstName = me.full_name.split(" ")[0];
  const profileIncomplete = !me.photo_url || !me.business_name;
  const canRegister = event && !registered && event.registration_open;

  return (
    <SafeAreaView style={styles.fill} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <Header
          title={event && registered ? event.name : "Tampa CarpetFest"}
          logoSize={120}
        />
        <Text style={styles.welcome}>{firstName ? `Welcome, ${firstName}!` : "Welcome!"}</Text>
        <ErrorText>{error}</ErrorText>

        {/* 1. Registered for the active event */}
        {event && registered ? (
          <>
            <Muted>
              You're registered! Browse attendees, check the schedule, and watch here for
              updates.
            </Muted>
            {profileIncomplete ? (
              <Card>
                <Text style={styles.cardTitle}>Finish your profile</Text>
                <Muted>Add a photo and your business so other attendees can find you.</Muted>
                <Button title="Edit my profile" onPress={() => router.navigate("/me")} />
              </Card>
            ) : null}

            <SectionTitle>Announcements</SectionTitle>
            {isAdmin ? (
              <Button
                title="+ New announcement"
                variant="secondary"
                onPress={() =>
                  router.push({ pathname: "/announcement-editor", params: { eventId: event.id } })
                }
              />
            ) : null}
            {announcements.length === 0 ? <Muted>No announcements yet.</Muted> : null}
            {announcements.map((a) => (
              <Card key={a.id}>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, { flex: 1 }]}>{a.title}</Text>
                  {isAdmin ? (
                    <Pressable
                      hitSlop={10}
                      onPress={() =>
                        router.push({ pathname: "/announcement-editor", params: { id: a.id } })
                      }
                    >
                      <Text style={styles.edit}>Edit</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.body}>{a.body}</Text>
                <Muted>
                  {new Date(a.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Muted>
              </Card>
            ))}

            <Pressable
              onPress={() =>
                router.navigate({ pathname: "/attendees", params: { view: "answers" } })
              }
              style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            >
              <Card style={styles.getToKnow}>
                <Ionicons name="albums" size={28} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Get to know everyone</Text>
                  <Muted>Pick a question and swipe through how other attendees answered.</Muted>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Card>
            </Pressable>

            <PollCard eventId={event.id} userId={userId} canVote={registered} />
          </>
        ) : null}

        {/* 2. An event is accepting registrations */}
        {canRegister ? (
          <Card style={styles.highlight}>
            <Text style={styles.cardTitle}>{event.name}</Text>
            <Text style={styles.body}>Now accepting registrations!</Text>
            <Muted>Have the event code ready. You'll get it from the event host.</Muted>
            <Button title="Register" onPress={() => router.push("/register")} />
          </Card>
        ) : null}

        {/* 3. Nothing to join right now */}
        {!(event && registered) && !canRegister ? (
          <Card>
            <Text style={styles.cardTitle}>News on the next event coming soon!</Text>
            <Muted>Check back here. When registration opens, you'll be able to sign up.</Muted>
          </Card>
        ) : null}

        <Button
          title="Previous events"
          variant="secondary"
          onPress={() => router.push("/attendees/previous")}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  welcome: { color: colors.text, fontSize: 20, fontWeight: "600", textAlign: "center" },
  cardTitle: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  edit: { color: colors.accent, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
  body: { color: colors.text, fontSize: 16, lineHeight: 23 },
  highlight: { borderWidth: 1, borderColor: colors.accent },
  getToKnow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
