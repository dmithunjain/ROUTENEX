# ROUTENEX

**Every Student. Every Route. Every Destination.**

ROUTENEX is a connected rural mobility platform for students, local transport providers and
college administrators. Bus routes, shared student rides, community EV providers and network
administration live in one place and read from the same transport records.

## What the product does

| Area | What you can do |
| --- | --- |
| Public site | Read about the network, explore the five features and map preview, contact the team, sign in or register |
| Student workspace | Dashboard, smart journey planner, student pooling, community EV rides, saved journeys, travel assistant |
| Provider workspace | Manage availability, register vehicles, accept or decline student ride requests |
| Admin workspace | Overview, transport (buses, stops, routes, schedules), students, providers, vehicles, ride requests |

Every EV ride is confirmed only after the provider accepts it, and administrator changes appear in
student search results immediately because all screens share one data store.

## Demo credentials

| Role | Sign in with | Password |
| --- | --- | --- |
| Student | `ananya@example.edu` | any 6+ characters |
| Provider | `prakash@greenwheels.in` | any 6+ characters |
| Admin | `routenex@1` | `routenex755` |

The sign-in page has one-click buttons that fill each set of demo credentials. New student and
provider accounts can be created from **Register**; admin accounts cannot be self-registered.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Landing page |
| `/login`, `/register` | Authentication |
| `/privacy`, `/terms` | Legal pages |
| `/student` | Student dashboard |
| `/student/planner` | Smart journey planner |
| `/student/pooling` | Student pooling |
| `/student/ev` | Community EV rides |
| `/student/saved` | Saved journeys |
| `/student/assistant` | Travel assistant |
| `/provider` | Provider workspace |
| `/admin` | Admin overview |
| `/admin/transport` | Buses, stops, routes, schedules |
| `/admin/students` | Student records |
| `/admin/providers` | Provider verification |
| `/admin/vehicles` | Shared fleet |
| `/admin/requests` | Ride and pooling requests |

Portal routes are guarded by role. A signed-out visitor is sent to `/login` with the requested
page remembered, and a signed-in user who opens another role's workspace is returned to their own.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + Vite 8 |
| Language | JavaScript (ES modules) |
| Styling | Tailwind CSS v4 |
| Routing | React Router 7 |
| Charts | Recharts |
| Maps | SVG network schematic generated from shared stop coordinates |
| Icons | lucide-react |
| State | React context + `localStorage` persistence (`routenex.db.v3`) |
| Live data | [Open-Meteo](https://open-meteo.com) free weather API (listed in [public-apis](https://github.com/public-apis/public-apis)) |

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # preview the production build
npm run lint     # oxlint
```

Optionally create a `.env` with `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` to override the demo
administrator credentials. Only `VITE_`-prefixed values reach the browser.

## Data model

`src/data/seed.js` holds clearly labelled sample records for villages, stops, routes, schedules,
buses, EV vehicles, providers, students, pooling groups, ride requests and saved journeys.

`AppDataContext` exposes the single store and every mutation (add/update/delete for each collection,
provider verification, availability, role and active-student selection, and a full demo reset).
Records persist to `localStorage` under `routenex.db.v3`; bumping the seed `version` resets a stale
store to clean sample data.

Services in `src/services/` contain the shared logic:

- `transportService.js` — stops, routes, schedules, availability and fare/segment helpers.
- `poolingService.js` — nearby-origin and departure-window matching for pooling groups.
- `assistantService.js` — grounded answers built only from current app data.
- `analyticsService.js` — admin and student summary metrics.

## Live external data

The landing page shows current weather for the Uthiramerur hub using Open-Meteo, a free API from the
public-apis directory. The request is browser-side and includes only coordinates and a timezone.
If the API is unreachable the card shows a fallback message and the rest of the platform continues
to use labelled sample transport data.

## Known limitations

- **Demo authentication only.** Credentials are validated in the browser and the admin password is
  bundled at build time. Before production, move authentication to a backend (for example Supabase
  Auth) with hashed passwords, server-side authorization and audit logging.
- **No real payments.** Fares are estimates shown before a request; no payment is collected.
- **Sample transport data.** Routes, schedules, seat counts and provider availability are
  illustrative and not live operator feeds.
- **Local persistence.** Accounts, requests and contact messages live in this browser. Clearing
  site data resets the demo.
- **Map preview is schematic.** It is generated from the seeded stop coordinates and is not a
  geographic map service.

## Project structure

```
src/
├── components/
│   ├── common/           Button, Badge, Container, Logo, LegalDoc, ...
│   ├── landing/          NetworkMapPreview, LiveConditions
│   └── layout/           AppLayout, Navbar, Footer
├── config/               auth configuration
├── constants/            app metadata
├── context/              AppDataContext (shared store), AuthContext (sessions)
├── data/                 seed data
├── features/             feature-scoped modules
├── hooks/                useDocumentTitle and other hooks
├── pages/                landing, auth, legal, student, provider, admin screens
├── routes/               route table, path constants, RequireAuth guard
├── services/             transport, pooling, assistant and analytics logic
└── styles/               Tailwind entry point and design tokens
```

The `@/` alias resolves to `src/`.
