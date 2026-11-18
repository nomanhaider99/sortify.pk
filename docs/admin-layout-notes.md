# Admin Layout Notes (admin-dashboard-design.webp)

Observations from `admin-dashboard-design.webp` (a light-themed dashboard shown in perspective) and
how each part maps to our admin pages (PLAN.md §6). **We reproduce the layout only.** The
reference's purple/indigo accents, pink/teal icon chips, logo and product name are replaced by our
palette: sage `#9CAF88` accents, off-white `#F7F5EF` canvas, dark-green `#4F6B3F` primary buttons.
Because the reference is light, our **light mode** follows it directly; **dark mode** is derived
from our palette (`#141A12` canvas, `#1B2318` surfaces, sage accents) with a toggle.

---

## Overall frame

- Two-pane app shell: fixed **left sidebar** (≈220px wide) + **main area**.
- Sidebar is a white surface separated by a 1px hairline; main area is a slightly darker neutral
  canvas so white cards float on it.
- No heavy shadows: cards are white with a very soft shadow/hairline and ~12–14px radius. The whole
  feel is airy, with generous padding (≈24px card padding, ≈16–20px grid gaps).

## Sidebar

- **Top:** logo mark + product name (bold, ~16px) and a small "collapse sidebar" icon button on the right.
- **Section label** `OVERVIEW` in small uppercase, muted, letter-spaced.
- **Nav items:** outline icon (≈18px) + label (~14px regular), ≈36px row height, ≈8px radius.
  The active item (`Dashboard`) has a soft tinted pill background and accent-coloured text/icon;
  inactive items are muted grey.
- Second section label `SETTINGS & CONFIGURATION`, containing an **expandable group**
  (`System Settings` with chevron) whose children are indented and marked with small bullet dots.
- Bottom: `Support` item pinned at the end.

**Mapping to our sidebar (§6.4):**

- `OVERVIEW`: Dashboard.
- `STORE`: Orders (live badge for new orders), Products, Categories, Reviews (pending badge),
  Customers, Messages (unread badge).
- `ADMINISTRATION`: Users & Roles, Settings (expandable: Store info, Shipping, Payments, Homepage &
  Announcement), Audit Log.
- Bottom: Profile + theme toggle + sign out. Items the user lacks `*:view` permission for are not
  rendered (server still enforces).
- Active item: `--primary-soft` pill with `--primary-strong` text (light) / sage text on a deep
  green tint (dark). Collapsible to an icon rail (the collapse button in the reference).
- Mobile: sidebar becomes an off-canvas sheet opened from the top bar.

## Top bar

- Page title on the left (`Dashboard`, ~22px semibold).
- Search field on the right (rounded, light grey fill, magnifier icon, placeholder "Search").
- Hairline bottom border, same white surface as the sidebar.

**Mapping:** page title (+ breadcrumb on detail pages) left; right side: search button that opens
the **command palette** (`Ctrl/⌘ K` hint), theme toggle, notifications bell (new orders), avatar menu.

## Dashboard grid

- **KPI cards** in a 2×2 grid (top-left area), each card:
  - Small coloured icon chip + label (`Total Orders`, ~14px).
  - Big number (~26px semibold).
  - Trend delta with arrow, green for up / red for down, followed by muted "vs Last month".
  - A **sparkline area chart** on the right side of the card (soft gradient fill).
- A **right-hand column** (cut off) starting at the same top line — a "Recent …" list with icon
  avatars (recent activity/orders).
- **Sales Performance** — wide card below the KPIs: title left, **segmented control**
  (`Daily / Weekly / Annually`, active segment filled dark) on the right; smooth area/line chart
  with light gradient fill, horizontal gridlines, month labels on the x-axis, value ticks on the
  y-axis, and a dark tooltip bubble with a vertical guide line at the hovered point.
- **Top Selling Products** — table card below: title, columns with sortable header icons
  (`Total Orders`, `Price ↕`).

**Mapping (§6.4 Dashboard):**

- KPI cards (4 across on wide screens, 2×2 on medium, 1 col on mobile): Revenue, Orders, AOV,
  New customers, each with delta vs previous period + sparkline. Period switcher Today/7d/30d.
- Right column: **Needs attention** panel (unconfirmed orders, low stock, pending reviews, unread
  messages) on top, **Recent orders** list below.
- Revenue/orders area chart card with segmented control (7d / 30d / 12m) — Recharts, sage fill
  gradient, `--primary-strong` line, dark tooltip.
- Orders-by-status card (horizontal bars) + **Top products** table card.

## Tables (used across Orders, Products, Customers, Reviews…)

- White card container, title row, muted small-caps header row with sort indicators, hairline row
  separators, ~48px rows (dense toggle → 36px), right-aligned numeric columns.

## Typography & tokens

- Geometric sans throughout (looks like DM Sans): 22px page titles, 16px card titles, 14px body,
  12px labels. We use **DM Sans** for admin.
- Radius: cards ≈12px, nav pills/inputs ≈8px, segmented control fully rounded.
- Accent use is restrained: only active nav, primary buttons, chart line/fill and the segmented
  control's active state.

## Pages not in the reference (extend in the same language)

Roles permission matrix (table card with checkbox grid), Audit log (filterable table), Orders inbox
split view (list card left, detail card right), Settings (stacked form cards), Login (centred card
on the canvas).
