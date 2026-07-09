/**
 * Hand-written stub of the Supabase schema (P0 subset: places + place_images).
 * Mirrors Backend_Schema.md §4.4–4.5. Replace later with the generated file:
 *   supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'resort'
  | 'art_cafe'
  | 'pottery'
  | 'adventure'
  | 'movie'
  | 'workshop'
  | 'event'
  | 'live_music'
  | 'festival'
  | 'attraction'
  | 'experience'
  | 'other';

export type MoodTag =
  | 'romantic'
  | 'budget'
  | 'luxury'
  | 'adventure'
  | 'nature'
  | 'nightlife'
  | 'indoor'
  | 'outdoor'
  | 'trending'
  | 'chill'
  | 'foodie';

export type PlaceSource = 'manual' | 'google_places' | 'import';

export interface PlaceRow {
  id: string;
  name: string;
  category: PlaceCategory;
  description: string | null;
  city: string;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_level: number | null;
  avg_cost_inr: number | null;
  rating: number | null;
  moods: MoodTag[];
  tags: string[];
  timings: Record<string, unknown> | null;
  booking_url: string | null;
  cover_url: string | null;
  source: PlaceSource;
  external_ref: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaceImageRow {
  id: string;
  place_id: string;
  url: string;
  position: number;
  blurhash: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  onboarded_at: string | null;
  couple_id: string | null;
  pairing_skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CoupleStatus = 'pending' | 'active';

export interface CoupleRow {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
  status: CoupleStatus;
  paired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteCodeRow {
  code: string;
  couple_id: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      places: {
        Row: PlaceRow;
        Insert: Partial<PlaceRow> & Pick<PlaceRow, 'name' | 'category' | 'city'>;
        Update: Partial<PlaceRow>;
        Relationships: [];
      };
      place_images: {
        Row: PlaceImageRow;
        Insert: Partial<PlaceImageRow> & Pick<PlaceImageRow, 'place_id' | 'url'>;
        Update: Partial<PlaceImageRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      couples: {
        Row: CoupleRow;
        Insert: Partial<CoupleRow> & Pick<CoupleRow, 'user_a_id'>;
        Update: Partial<CoupleRow>;
        Relationships: [];
      };
      invite_codes: {
        Row: InviteCodeRow;
        Insert: Partial<InviteCodeRow> & Pick<InviteCodeRow, 'code' | 'couple_id' | 'created_by'>;
        Update: Partial<InviteCodeRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      redeem_invite_code: {
        Args: { p_code: string };
        Returns: string;
      };
    };
    Enums: {
      place_category: PlaceCategory;
      mood_tag: MoodTag;
      place_source: PlaceSource;
      couple_status: CoupleStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
