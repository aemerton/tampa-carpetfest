import { router, useLocalSearchParams } from "expo-router";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Muted, Screen } from "@/components/ui";
import { useIsAdmin } from "@/lib/auth";

export default function ManageProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAdmin = useIsAdmin();

  if (!isAdmin || !id) {
    return (
      <Screen edges={[]}>
        <Muted>Only event admins can manage attendee profiles.</Muted>
      </Screen>
    );
  }

  return (
    <ProfileEditor
      profileId={id}
      mode="admin"
      onSaved={() => (router.canGoBack() ? router.back() : router.replace("/attendees"))}
    />
  );
}
