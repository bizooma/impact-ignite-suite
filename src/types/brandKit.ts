/**
 * TypeScript types for the brand_kits + brand_kit_imports tables.
 * Mirrors the Supabase schema; tolerant of nulls because all branding
 * fields are optional during setup.
 */

export interface BrandKit {
  id: string;
  organization_id: string;

  // Colors (hex)
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  background_color: string | null;
  extended_palette: string[];

  // Typography
  heading_font_family: string | null;
  body_font_family: string | null;
  heading_font_url: string | null;
  body_font_url: string | null;
  heading_font_weight: string | null;
  body_font_weight: string | null;

  // Logos (storage URLs)
  logo_primary_url: string | null;
  logo_mark_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;

  // Voice & content
  tagline: string | null;
  mission_statement: string | null;
  voice_descriptors: string[];
  do_use: string | null;
  dont_use: string | null;

  // Status
  source: 'manual' | 'pdf_import' | 'hybrid';
  setup_completed_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface BrandKitColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface BrandKitImport {
  id: string;
  brand_kit_id: string | null;
  organization_id: string;
  pdf_file_path: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  extracted_data: ExtractedBrandData;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedBrandData {
  colors?: Array<{ hex: string; role?: string; label?: string }>;
  fonts?: Array<{ name: string; usage?: 'heading' | 'body' | 'unknown' }>;
  logos?: Array<{ storage_path: string; url: string; width?: number; height?: number }>;
  tagline?: string;
  mission_statement?: string;
  voice_descriptors?: string[];
  raw_text?: string;
}

export type BrandKitInsert = Partial<Omit<BrandKit, 'id' | 'created_at' | 'updated_at'>> & {
  organization_id: string;
};
