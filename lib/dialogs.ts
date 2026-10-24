import { Alert, Platform } from "react-native";

export function notify(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert(message);
}

/** Yes/no prompt that works on web and phones. Resolves true if confirmed. */
export function confirm(title: string, message: string, confirmLabel = "Delete"): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
