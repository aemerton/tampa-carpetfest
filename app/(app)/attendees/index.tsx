import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/profile";
import { ErrorText, Header, Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";
import type { Profile } from "@/lib/types";

type Row = Pick<
  Profile,
  "id" | "full_name" | "business_name" | "city_state" | "favorite_species" | "photo_url"
>;

export default function Attendees() {
  const [query, setQuery] = useState("");
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, business_name, city_state, favorite_species, photo_url")
      .neq("full_name", "")
      .order("full_name");
    if (error) throw error;
    return data as Row[];
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((a) =>
      [a.full_name, a.business_name, a.city_state, a.favorite_species].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [data, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <Header title="Attendees" logoSize={72} />
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, business, species, or city"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
            <ErrorText>{error}</ErrorText>
            {data ? (
              <Muted>
                {filtered.length} {filtered.length === 1 ? "attendee" : "attendees"}
              </Muted>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          data ? <Muted>{query ? "No one matches that search." : "No attendees yet."}</Muted> : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/attendees/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <Avatar uri={item.photo_url} name={item.full_name} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {[item.business_name, item.favorite_species].filter(Boolean).join(" • ") ||
                  " "}
              </Text>
              {item.city_state ? <Muted>{item.city_state}</Muted> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.sm,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  name: { color: colors.accent, fontSize: 16, fontWeight: "700" },
  sub: { color: colors.text, fontSize: 14 },
});
