import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Button, Card, ErrorText, Loading, Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";
import type { Announcement } from "@/lib/types";

export default function ManageAnnouncements() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data, error } = useScreenData(async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Announcement[];
  }, [eventId]);

  if (!data && !error) return <Loading />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.page}>
      <Muted>Announcements show on the Home screen for everyone registered.</Muted>
      <Button
        title="+ New announcement"
        onPress={() => router.push({ pathname: "/announcement-editor", params: { eventId } })}
      />
      <ErrorText>{error}</ErrorText>
      {data?.length === 0 ? <Muted>No announcements yet.</Muted> : null}
      {data?.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => router.push({ pathname: "/announcement-editor", params: { id: a.id } })}
        >
          <Card>
            <Text style={styles.title}>{a.title}</Text>
            <Text style={styles.body} numberOfLines={3}>
              {a.body}
            </Text>
            <Muted>Tap to edit or delete</Muted>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  title: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
});
