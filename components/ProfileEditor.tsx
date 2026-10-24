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
import { PAST_EVENT_YEARS } from "@/lib/constants";
import { notify } from "@/lib/dialogs";
import { deletePhotos, pickAndUploadPhoto, type PhotoKind } from "@/lib/photos";
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

const PHOTO_FIELD = {
  profile: "photo_url",
  "pet-reptile": "pet_reptile_photo_url",
  "other-pet": "other_pet_photo_url",
} as const satisfies Record<PhotoKind, keyof EditableProfile>;

const photoUrls = (p: EditableProfile) =>
  Object.values(PHOTO_FIELD)
    .map((k) => p[k])
    .filter((u): u is string => !!u);

/**
 * The profile form. `mode="self"` is the My Profile tab; `mode="admin"` is an
 * admin editing someone else's profile from the Manage button.
 */
export function ProfileEditor({
  profileId,
  mode,
  onSaved,
}: {
  profileId: string;
  mode: "self" | "admin";
  onSaved?: () => void;
}) {
  const isSelf = mode === "self";
  const [form, setForm] = useState<EditableProfile | null>(null);
  const [saved, setSaved] = useState<EditableProfile | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<PhotoKind | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else {
          const p = pickEditable(data as Profile);
          setForm(p);
          setSaved(p);
        }
      });
  }, [profileId]);

  if (!form) {
    return error ? (
      <Screen edges={isSelf ? ["top"] : []}>
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
      // Photos always go in the profile owner's folder, even when an admin uploads.
      const url = await pickAndUploadPhoto(profileId, kind);
      if (url) set(PHOTO_FIELD[kind], url);
    } catch (e: any) {
      setError(`Photo upload failed: ${e?.message ?? "unknown error"}`);
    } finally {
      setUploading(null);
    }
  }

  const removePhoto = (kind: PhotoKind) => set(PHOTO_FIELD[kind], null);

  function toggleYear(year: number) {
    const years = form!.years_attended;
    set(
      "years_attended",
      years.includes(year)
        ? years.filter((y) => y !== year)
        : [...years, year].sort((a, b) => a - b)
    );
  }

  async function save() {
    setError("");
    if (!form!.full_name.trim()) {
      setError("Name can't be empty.");
      return;
    }
    setSaving(true);
    // Store blank text fields as null so empty sections stay hidden.
    const update = Object.fromEntries(
      Object.entries(form!).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() || (k === "full_name" ? v : null) : v,
      ])
    ) as EditableProfile;

    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", profileId)
      .select("id");
    if (error || !data?.length) {
      setSaving(false);
      setError(error?.message ?? "You don't have permission to edit this profile.");
      return;
    }

    // Delete photo files that were removed or replaced.
    const keep = new Set(photoUrls(update));
    await deletePhotos(photoUrls(saved!).filter((u) => !keep.has(u)));

    setSaved(update);
    setSaving(false);
    notify(isSelf ? "Profile saved!" : "Changes saved.");
    onSaved?.();
  }

  const label = (selfText: string, adminText: string) => (isSelf ? selfText : adminText);

  return (
    <Screen edges={isSelf ? ["top"] : []}>
      {!isSelf ? (
        <Card style={styles.adminNote}>
          <Text style={styles.adminNoteTitle}>Admin editing</Text>
          <Muted>
            You're editing {saved?.full_name || "this attendee"}'s profile. They won't be
            notified. Changes show up for everyone as soon as you save.
          </Muted>
        </Card>
      ) : null}

      <View style={styles.photoBlock}>
        <Avatar uri={form.photo_url} name={form.full_name} size={120} glowing />
        <Button
          title={form.photo_url ? "Change photo" : "Add a photo"}
          variant="ghost"
          loading={uploading === "profile"}
          onPress={() => upload("profile")}
        />
        {form.photo_url ? <RemoveLink onPress={() => removePhoto("profile")} /> : null}
      </View>

      <SectionTitle>{label("About you", "About them")}</SectionTitle>
      <Field label="Name" {...text("full_name")} autoComplete={isSelf ? "name" : "off"} />
      <Field label="Business name" {...text("business_name")} />
      <Field label="City, State" {...text("city_state")} placeholder="Tampa, FL" />
      <Field
        label={label("About you / your business", "About them / their business")}
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
        onRemove={() => removePhoto("pet-reptile")}
      />
      <Field label="Name" {...text("pet_reptile_name")} />
      <Field label="Species" {...text("pet_reptile_species")} />
      <Field label="Morph" {...text("pet_reptile_morph")} />

      <SectionTitle>Other pet</SectionTitle>
      <PetPhoto
        uri={form.other_pet_photo_url}
        loading={uploading === "other-pet"}
        onPress={() => upload("other-pet")}
        onRemove={() => removePhoto("other-pet")}
      />
      <Field label="Name" {...text("other_pet_name")} />
      <Field label="Type of animal" {...text("other_pet_type")} placeholder="Dog, cat…" />

      <SectionTitle>{label("CarpetFests you've attended", "CarpetFests attended")}</SectionTitle>
      <Muted>Tap each year to turn it on or off.</Muted>
      <YearBadges years={PAST_EVENT_YEARS} selected={form.years_attended} onToggle={toggleYear} />

      <ErrorText>{error}</ErrorText>
      <Button
        title={isSelf ? "Save profile" : "Save changes"}
        onPress={save}
        loading={saving}
        disabled={!!uploading}
        style={{ marginTop: spacing.md }}
      />

      {isSelf ? (
        <Card style={{ marginTop: spacing.xl }}>
          <Button title="Log out" variant="secondary" onPress={() => supabase.auth.signOut()} />
        </Card>
      ) : null}
    </Screen>
  );
}

function RemoveLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ alignSelf: "center" }}>
      <Text style={styles.remove}>Remove photo</Text>
    </Pressable>
  );
}

function PetPhoto({
  uri,
  loading,
  onPress,
  onRemove,
}: {
  uri: string | null;
  loading: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable onPress={onPress} style={styles.petPhoto} disabled={loading}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} /> : null}
        <View style={styles.petPhotoLabel}>
          <Text style={{ color: colors.accent, fontWeight: "700" }}>
            {loading ? "Uploading…" : uri ? "Change photo" : "Add a photo"}
          </Text>
        </View>
      </Pressable>
      {uri ? <RemoveLink onPress={onRemove} /> : null}
    </View>
  );
}

function pickEditable(p: Profile): EditableProfile {
  return Object.fromEntries(EDITABLE_KEYS.map((k) => [k, p[k]])) as EditableProfile;
}

const styles = StyleSheet.create({
  adminNote: { borderWidth: 1, borderColor: colors.accent },
  adminNoteTitle: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  photoBlock: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.md },
  remove: { color: colors.danger, fontSize: 14, fontWeight: "600" },
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
