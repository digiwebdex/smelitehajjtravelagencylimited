import { supabase } from "@/integrations/supabase/client";

export async function getCurrentTenant() {
  const domain = window.location.hostname;

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("domain", domain)
    .single();

  if (error) {
    console.error("Tenant not found:", error);
    return null;
  }

  return data;
}