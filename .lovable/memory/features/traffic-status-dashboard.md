---
name: Traffic Status Dashboard
description: Admin Traffic Status panel logging anonymous page visits with location, device, source.
type: feature
---
The admin panel includes a "Traffic Status" tab under Reports showing live visitor analytics:
- Data source: `page_visits` table (RLS: anon insert, admin select).
- Tracker: `src/hooks/useVisitTracker.ts` invoked from `AnalyticsTracker` (skips /admin and /auth routes).
- Visitor identity: persistent `smelite_visitor_id` in localStorage; 30-min `smelite_session_id` in sessionStorage.
- Geolocation: ipapi.co (cached); device/browser/OS detected from user agent.
- Dashboard component: `src/components/admin/AdminTrafficStatus.tsx` — summary cards, area chart timeline, top countries, traffic sources, devices pie, browsers, top pages, recent visits table.
- Range filter: Today / 7 / 30 / 90 days, auto-refresh every 60s.
