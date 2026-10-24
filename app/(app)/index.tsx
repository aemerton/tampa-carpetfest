import { router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, ErrorText, Header, Muted, SectionTitle } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { EVENT_YEAR } from "@/lib/constants";
import { useScreenData } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";
import type { Announcement, Profile } from "@/lib/types";

export default function Home() {
  const userId = useUserId();
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const [me, news] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, photo_url, business_name")
        .eq("id", userId)
        .single(),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    ]);
    if (me.error) throw me.error;
    if (news.error) throw news.error;
    return {
      me: me.data as Pick<Profile, "full_name" | "photo_url" | "business_name">,
      announcements: news.data as Announcement[],
    };
  }, [userId]);

  const firstName = data?.me.full_name.split(" ")[0];
  const profileIncomplete = data && (!data.me.photo_url || !data.me.business_name);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <Header title={`Tampa CarpetFest ${EVENT_YEAR}`} logoSize={120} />
        <Text style={styles.welcome}>
          {firstName ? `Welcome, ${firstName}!` : "Welcome!"}
        </Text>
        <Muted>Browse attendees, check the schedule, and keep an eye here for updates.</Muted>

        {profileIncomplete ? (
          <Card>
            <Text style={styles.cardTitle}>Finish your profile</Text>
            <Muted>Add a photo and your business so other attendees can find you.</Muted>
            <Button title="Edit my profile" onPress={() => router.navigate("/me")} />
          </Card>
        ) : null}

        <SectionTitle>Announcements</SectionTitle>
        <ErrorText>{error}</ErrorText>
        {data?.announcements.length === 0 ? <Muted>No announcements yet.</Muted> : null}
        {data?.announcements.map((a) => (
          <Card key={a.id}>
            <Text style={styles.cardTitle}>{a.title}</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  body: { color: colors.text, fontSize: 16, lineHeight: 23 },
});
