import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/**
 * Runs `load` each time the screen comes into view, so lists stay fresh
 * after someone edits their profile on another tab.
 */
export function useScreenData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(async () => {
    try {
      setError("");
      setData(await load());
    } catch (e: any) {
      setError(e?.message ?? "Couldn't load this right now.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { data, error, refreshing, refresh };
}
