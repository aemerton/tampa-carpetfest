import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar } from "@/components/profile";
import { ErrorText, Muted } from "@/components/ui";
import { colors, radius, spacing } from "@/lib/theme";
import type { ProfileSummary } from "@/lib/types";

/**
 * Searchable list of attendees. Tapping someone opens their profile unless
 * `renderAction` is given (used by the admin list for a Remove button).
 */
export function AttendeeList({
  attendees,
  header,
  error,
  refreshing = false,
  onRefresh,
  emptyText = "No one's registered yet.",
  renderAction,
}: {
  attendees: ProfileSummary[] | null;
  header?: ReactNode;
  error?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyText?: string;
  renderAction?: (a: ProfileSummary) => ReactNode;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attendees ?? [];
    return (attendees ?? []).filter((a) =>
      [a.full_name, a.business_name, a.city_state, a.favorite_species].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [attendees, query]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={filtered}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
      ListHeaderComponent={
        <View style={{ gap: spacing.md }}>
          {header}
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
          {attendees ? (
            <Muted>
              {filtered.length} {filtered.length === 1 ? "attendee" : "attendees"}
            </Muted>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        attendees ? <Muted>{query ? "No one matches that search." : emptyText}</Muted> : null
      }
      renderItem={({ item }) => {
        const body = (
          <>
            <Avatar uri={item.photo_url} name={item.full_name} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {[item.business_name, item.favorite_species].filter(Boolean).join(" • ") || " "}
              </Text>
              {item.city_state ? <Muted>{item.city_state}</Muted> : null}
            </View>
          </>
        );
        return renderAction ? (
          <View style={styles.row}>
            {body}
            {renderAction(item)}
          </View>
        ) : (
          <Pressable
            onPress={() => router.push(`/attendees/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            {body}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        );
      }}
    />
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
