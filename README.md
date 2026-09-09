# Revision HQ — web app foundation

This is the hosted-app version of Revision HQ. It remains a dependency-light static front end, with Vercel serverless API routes for Google integration.

## What works now
- All existing Revision HQ study flows.
- Dated weekly Planner.
- Add, edit and delete tutor sessions.
- Repeat tutor sessions weekly for 4, 8 or 12 sessions.
- Current-week revision blocks are migrated into dated planner items.
- Local persistence remains as an offline fallback.

## Google connection (once deployed)
One OAuth connection is used for two narrow purposes:
1. `calendar.events.readonly` — show primary Google Calendar events in the Planner.
2. `drive.appdata` — store `revision-hq-state.json` in Google's private app-data area, giving Revision HQ cross-device progress sync without reading ordinary Drive files.

The app does **not** request Gmail/inbox access.

Set the environment variables in `.env.example`, register the deployment callback URL with Google OAuth, and deploy to Vercel.

## Persistence strategy
The browser writes locally first. When Google is connected, state is also synced to Drive appData. The newest `updatedAt` copy wins on startup, so the app stays usable offline and recovers cleanly when the network returns.
