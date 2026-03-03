import { supabase } from "@/integrations/supabase/client";

export interface Tenant {
  id: string;
  domain: string;
  name?: string;
  [key: string]: any;
}

let cachedTenant: Tenant | null = null;
let cachePromise: Promise<Tenant | null> | null = null;

/**
 * Detect the current tenant based on the browser's hostname.
 * Results are cached for the lifetime of the page to avoid redundant queries.
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  if (cachedTenant) return cachedTenant;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    let hostname = window.location.hostname;

    // Strip "www." prefix if present
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    const { data, error } = await (supabase as any)
      .from("tenants")
      .select("*")
      .eq("domain", hostname)
      .maybeSingle();

    if (error) {
      console.error("Tenant lookup failed:", error);
      cachePromise = null;
      return null;
    }

    if (!data) {
      console.warn("No tenant found for domain:", hostname);
      cachePromise = null;
      return null;
    }

    cachedTenant = data as Tenant;
    return cachedTenant;
  })();

  return cachePromise;
}

/**
 * Fetch active packages filtered by the current tenant.
 * Optionally filter by package type (hajj / umrah).
 */
export async function getTenantPackages(options?: {
  type?: "hajj" | "umrah";
  activeOnly?: boolean;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) return { data: null, error: new Error("Tenant not found") };

  let query = (supabase as any)
    .from("packages")
    .select(options?.select || "*");

  // Always filter by tenant
  query = query.eq("tenant_id", tenant.id);

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.activeOnly !== false) {
    query = query.eq("is_active", true);
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  return query;
}

/**
 * Clear the cached tenant (useful for testing or domain changes).
 */
export function clearTenantCache() {
  cachedTenant = null;
  cachePromise = null;
}
