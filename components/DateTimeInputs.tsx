// iOS/Android version. The web version lives in DateTimeInputs.web.tsx.
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { combine, formatDateStr, formatTimeStr, toDateStr, toTimeStr } from "@/lib/datetime";
import { colors, radius, spacing } from "@/lib/theme";

type Props = {
  label: string;
  value: string; // "YYYY-MM-DD" or "HH:MM"
  onChange: (value: string) => void;
};

function PickerField({ label, value, onChange, mode }: Props & { mode: "date" | "time" }) {
  const [open, setOpen] = useState(false);

  const current =
    mode === "date"
      ? combine(value || toDateStr(new Date()), "12:00")
      : combine("2000-01-01", value || "09:00");
  const shown = mode === "date" ? formatDateStr(value) : formatTimeStr(value);

  function handle(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed" || !picked) return;
    onChange(mode === "date" ? toDateStr(picked) : toTimeStr(picked));
  }

  return (
    <View style={{ gap: spacing.xs, flex: 1 }}>
      <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          padding: spacing.md,
        }}
      >
        <Text style={{ color: shown ? colors.text : colors.textMuted, fontSize: 16 }}>
          {shown || "Choose…"}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={current}
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant="dark"
          onChange={handle}
        />
      ) : null}
      {open && Platform.OS === "ios" ? (
        <Pressable onPress={() => setOpen(false)} style={{ alignSelf: "flex-end" }}>
          <Text style={{ color: colors.accent, fontWeight: "700", padding: spacing.sm }}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DateInput(props: Props) {
  return <PickerField {...props} mode="date" />;
}

export function TimeInput(props: Props) {
  return <PickerField {...props} mode="time" />;
}
