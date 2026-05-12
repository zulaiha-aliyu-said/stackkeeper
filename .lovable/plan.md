## Roadmap Page for StackVault

### Scope
Create a public `/roadmap` page showcasing product direction, with three status sections and a feature request CTA.

### Files to create/edit

1. **Create `src/pages/Roadmap.tsx`**
   - Public page (mirrors Contact page pattern: simple top nav, no Layout wrapper)
   - Header: "Roadmap - What's Coming Next"
   - Three sections as cards grid:
     - **Recently Shipped** (green/success badges): AI Receipt Scanner, Tool Comparison, Time Machine, Network Visualization, Browser Extension
     - **Coming Soon** (warning/amber badges with Q2/Q3 2026 timeline): Tool Wrapped, AI Purchase Advisor, Mobile Apps
     - **Future Ideas** (muted badges): Stack Psychologist, Tool Resurrector, Public API, Desktop App
   - Each item card: name, 1-sentence description, status badge, timeline where applicable
   - Bottom CTA: "Want to request a feature? Email us: zulaihaaliyu440@gmail.com"
   - Uses existing design tokens: `bg-card`, `border-border`, `text-gradient`, semantic badges

2. **Edit `src/App.tsx`**
   - Add `<Route path="/roadmap" element={<Roadmap />} />` as a public route (like `/contact`, `/pricing`)

3. **Edit `src/components/Layout.tsx`**
   - Add `{ path: '/roadmap', label: 'Roadmap', icon: Map, mode: 'all' }` to `allNavLinks` array (import `Map` from `lucide-react`)

### Technical details
- No new dependencies.
- Follow existing dark-theme card patterns (`glass-card`, subtle gradients).
- Use shadcn `Card`, `Badge` components.
- Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop.
- Status badge colors: `success` for shipped, `warning` for coming soon, `secondary` for future ideas.
