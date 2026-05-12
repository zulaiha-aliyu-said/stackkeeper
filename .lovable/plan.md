## Add AppSumo to all LTD platform lists in the frontend

### Goal
Add 'AppSumo' as a recognized LTD platform everywhere platform lists appear in the UI.

### Files to change

1. **`src/types/tool.ts`** (source of truth)
   - Add `'AppSumo'` to the `Platform` union type
   - Add `'AppSumo'` to the `PLATFORMS` constant array
   - This automatically propagates to every dropdown, filter, and export that consumes `PLATFORMS`

2. **`src/lib/demoData.ts`**
   - Add `'AppSumo'` to the local `platforms` array so demo data can include it

3. **`src/components/EmailImportModal.tsx`**
   - Add AppSumo auto-detection regex: `else if (/appsumo/i.test(text)) platform = 'AppSumo';`

4. **`src/components/OnboardingWelcomeModal.tsx`**
   - Update the highlight text from "Supports LTD, DealMirror, DealFuel & more." to include AppSumo

### No changes needed
- `src/lib/extensionFiles.ts` — Already lists `appsumo.com` in the content script `matches` array
- `src/components/AddToolModal.tsx`, `src/pages/Analytics.tsx`, `src/hooks/useTools.ts` — All consume `PLATFORMS` from `src/types/tool.ts` and will auto-update

### Plan

```
Step 1: Update Platform type and PLATFORMS array in src/types/tool.ts
Step 2: Update demoData platforms array
Step 3: Add AppSumo email parsing detection
Step 4: Update onboarding mention text
```

No new dependencies. No backend changes required.