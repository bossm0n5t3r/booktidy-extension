import { kyoboAdapter } from "./adapters/kyobo-adapter";
import type { SiteAdapter } from "./adapters/site-adapter";

export const SITE_ADAPTERS = [kyoboAdapter] as const;

export const detectSiteAdapter = (
  url: URL,
  adapters: readonly SiteAdapter[] = SITE_ADAPTERS,
): SiteAdapter | null => {
  return adapters.find((adapter) => adapter.matches(url)) ?? null;
};
