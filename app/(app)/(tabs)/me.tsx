import { ProfileEditor } from "@/components/ProfileEditor";
import { useUserId } from "@/lib/auth";

export default function MyProfile() {
  const userId = useUserId();
  return <ProfileEditor profileId={userId} mode="self" />;
}
