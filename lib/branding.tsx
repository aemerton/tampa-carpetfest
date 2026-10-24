import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

/*
 * The app logo. Admins can upload a new one from Manage Event; until then
 * (or after "Reset to default") the built-in assets/images/logo.png is used.
 * The last-known logo is cached on the device so it shows instantly on launch.
 */

const CACHE_KEY = "carpetfest.logoUrl";

type Branding = {
  logoUrl: string | null;
  refresh: () => Promise<void>;
};

const BrandingContext = createContext<Branding>({ logoUrl: null, refresh: async () => {} });

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("app_settings").select("logo_url").single();
    if (error) return; // keep whatever we had
    const url = (data?.logo_url as string | null) ?? null;
    setLogoUrl(url);
    try {
      if (url) await AsyncStorage.setItem(CACHE_KEY, url);
      else await AsyncStorage.removeItem(CACHE_KEY);
    } catch {}
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then((cached) => cached && setLogoUrl((current) => current ?? cached))
      .catch(() => {});
    refresh();
  }, [refresh]);

  return (
    <BrandingContext.Provider value={{ logoUrl, refresh }}>{children}</BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
