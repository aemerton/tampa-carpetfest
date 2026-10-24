import { router } from "expo-router";
import { useState } from "react";
import { Button, Card, ErrorText, Field, Header, Muted, Screen } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setError("");
    if (!fullName.trim() || !email.trim() || !password || !inviteCode.trim()) {
      setError("Please fill in every field.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      // Friendly early check; the database enforces the code regardless.
      const { data: codeOk, error: codeErr } = await supabase.rpc("check_invite_code", {
        p_code: inviteCode,
      });
      if (codeErr) throw codeErr;
      if (!codeOk) {
        setError("That code isn't valid, or registration isn't open right now. Check with the event host.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), invite_code: inviteCode.trim() } },
      });
      if (error) throw error;

      // If email confirmation is turned on, there's no session until they confirm.
      if (!data.session) setCheckEmail(true);
      // Otherwise the root layout switches to the app automatically.
    } catch (e: any) {
      const msg: string = e?.message ?? "Something went wrong.";
      if (/already registered/i.test(msg)) {
        setError("An account with that email already exists. Try logging in.");
      } else if (/database error/i.test(msg)) {
        setError("That code isn't valid, or registration isn't open right now. Check with the event host.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <Screen>
        <Header title="Almost there" />
        <Card>
          <Muted>
            We sent a confirmation link to {email.trim()}. Open it on this device, then come
            back and log in.
          </Muted>
        </Card>
        <Button title="Back to log in" onPress={() => router.replace("/sign-in")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Create your account" />
      <Field
        label="Your name"
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        textContentType="name"
      />
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
        label="Password (8+ characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Field
        label="Event code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={signUp}
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Create account" onPress={signUp} loading={busy} />
      <Button
        title="I already have an account"
        variant="ghost"
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/sign-in"))}
      />
    </Screen>
  );
}
