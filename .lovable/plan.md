

## Plan: Apply Diretriz Visual Identity to the Platform

### Brand Identity Summary (from PDF)

| Element | Value |
|---------|-------|
| **Primary Red** | `#ED3537` (RGB 237, 50, 55) — icon/accent color |
| **Primary Dark Blue** | `#10143D` (approx. RGB 16, 20, 61) — text, backgrounds |
| **Light tints** | Red tints: `#F28B8B`, `#F6AEBD`, `#FBDCE6`; Blue tints: `#3C4A75`, `#6B7596`, `#9CA3AF`, `#D1D5DB` |
| **Font (headings)** | Kanit SemiBold |
| **Font (body)** | Kanit Regular / Metropolis Semi Bold (subtitle) |
| **Logo** | Red "D" arrow icon + dark blue "Diretriz" text |
| **App name** | Diretriz Contabilidade e Consultoria |

### Changes

1. **Copy logo asset** — Extract the horizontal logo from the PDF and save it to `src/assets/logo-diretriz.png`. Update `Header.tsx` and `Auth.tsx` imports.

2. **Update `index.css`** — Replace the entire CSS variable palette:
   - `--background`: dark blue (`#10143D` / `222 65% 10%`)
   - `--foreground`: light gray
   - `--card`: slightly lighter dark blue
   - `--primary`: red `#ED3537`
   - `--accent`: red or blue tint
   - `--secondary`, `--muted`, `--border`: blue tints from the brand guide
   - `--destructive`: keep red

3. **Update fonts** — Replace Google Fonts import from DM Sans/Outfit to **Kanit** (weights 400, 500, 600, 700). Update `--font-heading` and `--font-body` to Kanit.

4. **Update `tailwind.config.ts`** — Change `fontFamily.heading` and `fontFamily.body` to `["Kanit", "sans-serif"]`.

5. **Update `index.html`** — Change title and meta tags from "Lovable App" to "Diretriz - Contabilidade e Consultoria".

6. **Update `Auth.tsx`** — Change heading text from "ContábilView" to "Diretriz", update subtitle.

7. **Update `Header.tsx`** — Update alt text and ensure logo reference points to new asset.

### Technical Details

- CSS variables will be recalculated to HSL format for the Diretriz palette
- The Kanit font will be loaded from Google Fonts (it's available there)
- Logo will be copied from the parsed PDF images to `src/assets/`
- All existing component styling (cards, buttons, charts) will automatically inherit the new colors via CSS variables — no component-level changes needed

