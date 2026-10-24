import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, EventBadges, InfoRow, TabSwitcher } from "@/components/profile";
import { Card, ErrorText, Loading, Muted, SectionTitle } from "@/components/ui";
import { useIsAdmin } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { loadActiveEvent, loadPastEvents } from "@/lib/events";
import { loadAnswers, loadQuestions } from "@/lib/questions";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";
import type { Profile } from "@/lib/types";

type Tab = "background" | "petReptile" | "otherPet" | "qa";

export default function AttendeeProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("background");
  const isAdmin = useIsAdmin();
  const { data, error } = useScreenData(async () => {
    const [profile, past, questions, answers, active] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      loadPastEvents(id),
      loadQuestions(),
      loadAnswers(id),
      loadActiveEvent(id),
    ]);
    if (profile.error) throw profile.error;
    // Only the questions this person answered, in the current order.
    const qa = questions
      .filter((q) => answers[q.id])
      .map((q) => ({ id: q.id, prompt: q.prompt, answer: answers[q.id] }));
    // Answers open the swipe deck only for people on the active event's list.
    const deckEventId = active.event && active.registered ? active.event.id : null;
    return { p: profile.data as Profile, badges: past.map((e) => e.name), qa, deckEventId };
  }, [id]);

  if (error) {
    return (
      <View style={styles.page}>
        <ErrorText>Couldn't find this attendee.</ErrorText>
      </View>
    );
  }
  if (!data) return <Loading />;
  const { p, badges, qa, deckEventId } = data;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.page}>
      <Stack.Screen
        options={{
          headerRight: isAdmin
            ? () => (
                <Pressable
                  hitSlop={10}
                  style={styles.manage}
                  onPress={() =>
                    router.push({ pathname: "/manage-profile", params: { id: p.id } })
                  }
                >
                  <Ionicons name="create-outline" size={18} color={colors.onAccent} />
                  <Text style={styles.manageText}>Manage</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={styles.top}>
        <Avatar uri={p.photo_url} name={p.full_name} size={120} glowing />
        <Text style={styles.name}>{p.full_name}</Text>
        {p.business_name ? <Text style={styles.business}>{p.business_name}</Text> : null}
        {p.city_state ? <Muted>{p.city_state}</Muted> : null}
      </View>

      {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}

      <TabSwitcher<Tab>
        tabs={[
          { id: "background", label: "Background" },
          { id: "petReptile", label: "Pet Reptile" },
          { id: "otherPet", label: "Other Pet" },
          { id: "qa", label: "Q&A" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card>
        {tab === "background" ? (
          p.favorite_species || p.first_snake || p.place_to_visit ? (
            <>
              <InfoRow label="Favorite species" value={p.favorite_species} />
              <InfoRow label="First snake" value={p.first_snake} />
              <InfoRow label="Dream place to visit" value={p.place_to_visit} />
            </>
          ) : (
            <Muted>Nothing added yet.</Muted>
          )
        ) : null}

        {tab === "petReptile" ? (
          p.pet_reptile_name || p.pet_reptile_species || p.pet_reptile_photo_url ? (
            <>
              {p.pet_reptile_photo_url ? (
                <Image source={{ uri: p.pet_reptile_photo_url }} style={styles.petPhoto} />
              ) : null}
              <InfoRow label="Name" value={p.pet_reptile_name} />
              <InfoRow label="Species" value={p.pet_reptile_species} />
              <InfoRow label="Morph" value={p.pet_reptile_morph} />
            </>
          ) : (
            <Muted>Nothing added yet.</Muted>
          )
        ) : null}

        {tab === "otherPet" ? (
          p.other_pet_name || p.other_pet_type || p.other_pet_photo_url ? (
            <>
              {p.other_pet_photo_url ? (
                <Image source={{ uri: p.other_pet_photo_url }} style={styles.petPhoto} />
              ) : null}
              <InfoRow label="Name" value={p.other_pet_name} />
              <InfoRow label="Type" value={p.other_pet_type} />
            </>
          ) : (
            <Muted>Nothing added yet.</Muted>
          )
        ) : null}

        {tab === "qa" ? (
          qa.length ? (
            <>
              {deckEventId ? <Muted>Tap a question to see how everyone else answered.</Muted> : null}
              {qa.map((item, i) => (
                <Pressable
                  key={item.id}
                  disabled={!deckEventId}
                  onPress={() =>
                    router.push({
                      pathname: "/attendees/question/[questionId]",
                      params: { questionId: item.id, eventId: deckEventId!, start: p.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.qa,
                    i > 0 && styles.qaDivider,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.qaHeader}>
                    <Text style={[styles.question, { flex: 1 }]}>{item.prompt}</Text>
                    {deckEventId ? (
                      <Ionicons name="albums-outline" size={16} color={colors.accent} />
                    ) : null}
                  </View>
                  <Text style={styles.answer}>{item.answer}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            <Muted>No answers yet.</Muted>
          )
        ) : null}
      </Card>

      {badges.length ? (
        <>
          <SectionTitle>CarpetFests attended</SectionTitle>
          <EventBadges names={badges} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  qa: { gap: 4, paddingVertical: spacing.sm },
  qaHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  qaDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  question: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  answer: { color: colors.text, fontSize: 16, lineHeight: 23 },
  page: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: colors.bg,
  },
  manage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: 8,
  },
  manageText: { color: colors.onAccent, fontWeight: "700", fontSize: 14 },
  top: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  name: { color: colors.accent, fontSize: 24, fontWeight: "700", marginTop: spacing.md },
  business: { color: colors.text, fontSize: 17, fontWeight: "600" },
  bio: { color: colors.text, fontSize: 16, lineHeight: 23 },
  petPhoto: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
});
