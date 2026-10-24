import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, YearBadges } from "@/components/profile";
import {
  Button,
  Card,
  ErrorText,
  Field,
  Loading,
  Muted,
  Screen,
  SectionTitle,
} from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { PAST_EVENT_YEARS } from "@/lib/constants";
import { notify } from "@/lib/dialogs";
import { pickAndUploadPhoto, type PhotoKind } from "@/lib/photos";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";
import type { EditableProfile, Profile } from "@/lib/types";

const EDITABLE_KEYS: (keyof EditableProfile)[] = [
  "full_name",
  "business_name",
  "city_state",
  "bio",
  "photo_url",
  "favorite_species",
  "first_snake",
  "place_to_visit",
  "pet_reptile_name",
  "pet_reptile_species",
  "pet_reptile_morph",
  "pet_reptile_photo_url",
  "other_pet_name",
  "other_pet_type",
  "other_pet_photo_url",
  "years_attended",
];

const PHOTO_FIELD: Record<PhotoKind, keyof EditableProfile> = {
  profile: "photo_url",
  "pet-reptile": "pet_reptile_photo_url",
  "other-pet": "other_pet_photo_url",
};

export default function MyProfile() {
  const userId = useUserId();
  const [form, setForm] = useState<EditableProfile | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<PhotoKind | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setForm(pickEditable(data as Profile));
      });
  }, [userId]);

  if (!form) {
    return error ? (
      <Screen>
        <ErrorText>{error}</ErrorText>
      </Screen>
    ) : (
      <Loading />
    );
  }

  const set = <K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const text = (key: keyof EditableProfile) => ({
    value: (form[key] as string | null) ?? "",
    onChangeText: (v: string) => set(key, v as never),
  });

  async function upload(kind: PhotoKind) {
    setError("");
    setUploading(kind);
    try {
      const url = await pickAndUploadPhoto(userId, kind);
      if (url) set(PHOTO_FIELD[kind], url as never);
    } catch (e: any) {
      setError(`Photo upload failed: ${e?.message ?? "unknown error"}`);
    } finally {
      setUploading(null);
    }
  }

  function toggleYear(year: number) {
    const years = form!.years_attended;
    set(
      "years_attended",
      years.includes(year) ? years.filter((y) => y !== year) : [...years, year].sort((a, b) => a - b)
    );
  }

  async function save() {
    setError("");
    if (!form!.full_name.trim()) {
      setError("Your name can't be empty.");
      return;
    }
    setSaving(true);
    // Store blank text fields as null so empty sections stay hidden.
    const update = Object.fromEntries(
      Object.entries(form!).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() || (k === "full_name" ? v : null) : v,
      ])
    );
    const { error } = await supabase.from("profiles").update(update).eq("id", userId);
    setSaving(false);
    if (error) setError(error.message);
    else notify("Profile saved!");
  }

  return (
    <Screen>
      <View style={styles.photoBlock}>
        <Avatar uri={form.photo_url} name={form.full_name} size={120} glowing />
        <Button
          title={form.photo_url ? "Change photo" : "Add a photo"}
          variant="ghost"
          loading={uploading === "profile"}
          onPress={() => upload("profile")}
        />
      </View>

      <SectionTitle>About you</SectionTitle>
      <Field label="Name" {...text("full_name")} autoComplete="name" />
      <Field label="Business name" {...text("business_name")} />
      <Field label="City, State" {...text("city_state")} placeholder="Tampa, FL" />
      <Field
        label="About you / your business"
        {...text("bio")}
        multiline
        placeholder="What you keep, what you breed, how long you've been at it…"
      />

      <SectionTitle>Background</SectionTitle>
      <Field label="Favorite species" {...text("favorite_species")} />
      <Field label="First snake" {...text("first_snake")} />
      <Field label="Dream place to visit" {...text("place_to_visit")} />

      <SectionTitle>Pet reptile</SectionTitle>
      <PetPhoto
        uri={form.pet_reptile_photo_url}
        loading={uploading === "pet-reptile"}
        onPress={() => upload("pet-reptile")}
      />
      <Field label="Name" {...text("pet_reptile_name")} />
      <Field label="Species" {...text("pet_reptile_species")} />
      <Field label="Morph" {...text("pet_reptile_morph")} />

      <SectionTitle>Other pet</SectionTitle>
      <PetPhoto
        uri={form.other_pet_photo_url}
        loading={uploading === "other-pet"}
        onPress={() => upload("other-pet")}
      />
      <Field label="Name" {...text("other_pet_name")} />
      <Field label="Type of animal" {...text("other_pet_type")} placeholder="Dog, cat…" />

      <SectionTitle>CarpetFests you've attended</SectionTitle>
      <Muted>Tap each year you came.</Muted>
      <YearBadges
        years={PAST_EVENT_YEARS}
        selected={form.years_attended}
        onToggle={toggleYear}
      />

      <ErrorText>{error}</ErrorText>
      <Button title="Save profile" onPress={save} loading={saving} style={{ marginTop: spacing.md }} />

      <Card style={{ marginTop: spacing.xl }}>
        <Button title="Log out" variant="secondary" onPress={() => supabase.auth.signOut()} />
      </Card>
    </Screen>
  );
}

function PetPhoto({
  uri,
  loading,
  onPress,
}: {
  uri: string | null;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.petPhoto} disabled={loading}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.petPhotoLabel}>
        <Text style={{ color: colors.accent, fontWeight: "700" }}>
          {loading ? "Uploading…" : uri ? "Change photo" : "Add a photo"}
        </Text>
      </View>
    </Pressable>
  );
}

function pickEditable(p: Profile): EditableProfile {
  return Object.fromEntries(EDITABLE_KEYS.map((k) => [k, p[k]])) as EditableProfile;
}

const styles = StyleSheet.create({
  photoBlock: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.md },
  petPhoto: {
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  petPhotoLabel: {
    backgroundColor: "rgba(26,31,20,0.8)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
});
