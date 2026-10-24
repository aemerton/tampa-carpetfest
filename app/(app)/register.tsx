import { router } from "expo-router";
import { useState } from "react";
import { Button, Card, ErrorText, Field, Loading, Muted, Screen } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { notify } from "@/lib/dialogs";
import { friendlyError, loadActiveEvent } from "@/lib/events";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const userId = useUserId();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data } = useScreenData(() => loadActiveEvent(userId), [userId]);

  if (!data) return <Loading />;
  const { event, registered } = data;

  if (!event || !event.registration_open || registered) {
    return (
      <Screen edges={[]}>
        <Card>
          <Muted>
            {registered
              ? `You're already registered for ${event?.name}.`
              : "Registration isn't open right now."}
          </Muted>
        </Card>
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  async function register() {
    setError("");
    if (!code.trim()) {
      setError("Enter the event code.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("register_for_event", { p_code: code });
    setBusy(false);
    if (error) {
      setError(friendlyError(error));
      return;
    }
    notify(`You're registered for ${event!.name}! Take a minute to update your profile.`);
    if (router.canDismiss()) router.dismissAll();
    router.navigate("/me");
  }

  return (
    <Screen edges={[]}>
      <Card>
        <Muted>Enter the code for {event.name} to register.</Muted>
      </Card>
      <Field
        label="Event code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        onSubmitEditing={register}
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Register" onPress={register} loading={busy} />
    </Screen>
  );
}
