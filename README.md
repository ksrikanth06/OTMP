# Overtime Portal

A role-based front end for overtime submission, approval and reporting. Built with **TypeScript + Vite + Tailwind CSS + React Router + Redux Toolkit**.

This first iteration ships two screens — a role-aware **Login** and a **Home** dashboard shell (top header + left navigation + content area) — wired for three roles: **Employee**, **Manager** and **HR**.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build
npm run preview    # preview the production build
```

> Requires Node 18+ (Node 20/22 recommended).

## Demo credentials

Authentication uses a static directory standing in for SSO/LDAP. Password for all accounts: `123`

| Username           | Role     |
| ------------------ | -------- |
| `employee.srikanth`  | Employee |
| `manager.rama`   | Manager  |
| `hr.okafor`        | HR       |

Pick the matching role on the login screen — the role must match the account, mirroring an LDAP group check.

## How it's organised

```
src/
  config/        theme tokens, copy/branding, static credentials, role menus
  types/         shared domain types (roles, user, nav)
  store/         Redux Toolkit store, typed hooks, auth slice
  routes/        route table + protected-route guard
  layouts/       DashboardLayout (header + sidebar + content outlet)
  components/    common (Icon, Logo, Avatar), header, sidebar
  pages/         LoginPage, HomePage
```

### Design decisions

- **Nothing hardcoded in components.** Every user-facing string lives in `src/config/constants.ts`; every colour is a semantic Tailwind token (`brand`, `surface`, `content`, `line`, `state`) bound to CSS variables. Re-skin the whole app from `src/config/theme.ts` + `src/index.css`, or re-word it from `constants.ts`.
- **Red → black theme.** The gradient runs full-bleed only on the login brand panel and the logo/avatar marks; the workspace stays a disciplined near-black so the crimson reads as a signal, not noise.
- **Role drives the UI.** Navigation is data in `src/config/menu.ts` (`navByRole`); the sidebar and home cards render whatever matches the signed-in role. Adding a menu item is a config change.
- **Auth state in Redux.** `authSlice` exposes a `login` thunk (validates against the static directory) and persists the session to `localStorage`, so a refresh keeps you signed in. `ProtectedRoute` redirects unauthenticated users to `/login`.
- **Full-screen, responsive shell.** The layout fills the viewport at every size; below `lg` the sidebar collapses into a drawer toggled from the header.

## Wiring up a real backend

- Replace `authenticate()` in `src/config/credentials.ts` with your SSO/LDAP API call — the return shape (`AuthenticatedUser`) is all the rest of the app depends on.
- Remove the demo-accounts helper block in `src/pages/LoginPage.tsx`.
- Add role modules as routes under `/home` in `src/routes/AppRoutes.tsx`; they reuse `DashboardLayout` automatically.
```
