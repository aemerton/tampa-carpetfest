export type Profile = {
  id: string;
  full_name: string;
  business_name: string | null;
  city_state: string | null;
  bio: string | null;
  photo_url: string | null;
  favorite_species: string | null;
  first_snake: string | null;
  place_to_visit: string | null;
  pet_reptile_name: string | null;
  pet_reptile_species: string | null;
  pet_reptile_morph: string | null;
  pet_reptile_photo_url: string | null;
  other_pet_name: string | null;
  other_pet_type: string | null;
  other_pet_photo_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

// Fields a person (or an admin) can edit on a profile.
export type EditableProfile = Omit<
  Profile,
  "id" | "is_admin" | "created_at" | "updated_at"
>;

// The short version used in attendee lists.
export type ProfileSummary = Pick<
  Profile,
  "id" | "full_name" | "business_name" | "city_state" | "favorite_species" | "photo_url"
>;

export type CarpetEvent = {
  id: string;
  name: string;
  status: "active" | "closed";
  registration_open: boolean;
  allow_self_report: boolean;
  created_at: string;
  closed_at: string | null;
};

export type ItineraryItem = {
  id: string;
  event_id: string;
  starts_at: string;
  ends_at: string | null;
  title: string;
  location: string | null;
  description: string | null;
};

export type Announcement = {
  id: string;
  event_id: string;
  title: string;
  body: string;
  created_at: string;
};
