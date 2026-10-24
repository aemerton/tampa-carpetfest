import type { Ionicons } from "@expo/vector-icons";
import type { Profile } from "./types";

export type ContactLink = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string; // what's shown
  url: string; // what opens when tapped
};

const isUrl = (v: string) => /^https?:\/\//i.test(v) || /^www\./i.test(v);
const withScheme = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const stripScheme = (v: string) => v.replace(/^https?:\/\//i, "").replace(/\/$/, "");

/** Turns a handle, "site.com/name", or full URL into a link on that site. */
function siteLink(value: string, domain: string, path: (name: string) => string) {
  const v = value.trim();
  if (isUrl(v) || v.toLowerCase().includes(domain)) return withScheme(v);
  return `https://www.${domain}/${path(v.replace(/^@/, ""))}`;
}

/**
 * The contact details someone filled in, in display order, ready to show and
 * tap. Empty fields are left out entirely.
 */
export function contactLinks(p: Profile): ContactLink[] {
  const links: ContactLink[] = [];
  const v = (s: string | null) => (s ?? "").trim();

  if (v(p.contact_email)) {
    links.push({
      key: "email",
      label: "Email",
      icon: "mail",
      text: v(p.contact_email),
      url: `mailto:${v(p.contact_email)}`,
    });
  }
  if (v(p.phone)) {
    links.push({
      key: "phone",
      label: "Phone",
      icon: "call",
      text: v(p.phone),
      url: `tel:${v(p.phone).replace(/[^\d+]/g, "")}`,
    });
  }
  if (v(p.instagram)) {
    const url = siteLink(v(p.instagram), "instagram.com", (n) => n);
    const handle = url.replace(/\/$/, "").split("/").pop() ?? v(p.instagram);
    links.push({ key: "instagram", label: "Instagram", icon: "logo-instagram", text: `@${handle}`, url });
  }
  if (v(p.facebook)) {
    const url = siteLink(v(p.facebook), "facebook.com", (n) => n);
    links.push({ key: "facebook", label: "Facebook", icon: "logo-facebook", text: stripScheme(url).replace(/^www\./, ""), url });
  }
  if (v(p.morph_market)) {
    const url = siteLink(v(p.morph_market), "morphmarket.com", (n) => `stores/${n}`);
    links.push({ key: "morph_market", label: "MorphMarket", icon: "storefront", text: stripScheme(url).replace(/^www\./, ""), url });
  }
  if (v(p.website)) {
    const url = withScheme(v(p.website));
    links.push({ key: "website", label: "Website", icon: "globe", text: stripScheme(url).replace(/^www\./, ""), url });
  }
  return links;
}
