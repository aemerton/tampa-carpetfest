import { router } from "expo-router";
import { useState } from "react";
import { Button, ErrorText, Field, Header, Muted, Screen } from "@/components/ui";
import { EVENT_YEAR } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "That email and password don't match an account."
          : error.message
      );
    }
    // On success the root layout switches to the app automatically.
  }

  return (
    <Screen>
      <Header title={`Tampa CarpetFest ${EVENT_YEAR}`} logoSize={140} />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={signIn}
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Log in" onPress={signIn} loading={busy} />
      <Muted>Don't have an account yet?</Muted>
      <Button
        title="Create an account"
        variant="secondary"
        onPress={() => router.push("/sign-up")}
      />
    </Screen>
  );
}
