import { createElement } from "react";
import { Text, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

type Props = {
  label: string;
  value: string; // "YYYY-MM-DD" or "HH:MM"
  onChange: (value: string) => void;
};

const inputStyle = {
  backgroundColor: colors.surface,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  padding: spacing.md,
  fontSize: 16,
  fontFamily: "inherit",
  colorScheme: "dark",
  width: "100%",
  boxSizing: "border-box",
  minHeight: 48,
};

// On phone browsers these open the phone's own date and time wheels.
function NativeInput({ label, value, onChange, type }: Props & { type: "date" | "time" }) {
  return (
    <View style={{ gap: spacing.xs, flex: 1 }}>
      <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      {createElement("input", {
        type,
        value,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: inputStyle,
      })}
    </View>
  );
}

export function DateInput(props: Props) {
  return <NativeInput {...props} type="date" />;
}

export function TimeInput(props: Props) {
  return <NativeInput {...props} type="time" />;
}
