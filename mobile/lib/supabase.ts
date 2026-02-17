/**
 * Supabase client for the mobile app.
 *
 * The mobile app talks directly to Supabase for CRUD.
 * The Python sidecar is only used for "intelligence" (decay, ML).
 */

import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
