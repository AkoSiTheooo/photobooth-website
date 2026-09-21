# PhotoToy: design direction

Identity, personality, palette, typography, mood, dial. This is direction, not a rulebook; `.agents/skills/antislop/SKILL.md` is the filter applied on top.

## Identity

PhotoToy is a photobooth for children, run by a grown-up. A child walks up, takes four photos, picks a frame, and leaves with a printable strip. The name is the promise: a toy that makes photos.

## Personality

- Playful, bouncy, warm. Speaks to a child in short sentences.
- Confident, not saccharine. No cartoon mascots in the interface itself: the Disney feeling comes from the frames the organizer supplies and from the stage-like presentation.
- One voice per surface: kid copy on the flow pages, plain operational copy in the admin.

## Dial (declared)

ENERGY 3 (this design says hello loudly), RHYTHM 3 (no two pages share a composition), MOTION 2 (motion on interaction and state change, never on a loop).

Design Read: kid-facing photobooth app for children and their parents, in a playful storybook-bright language, dial ENERGY 3 / RHYTHM 3 / MOTION 2.

## Audience

Primary: children roughly 4 to 10, often reading with a parent. Secondary: parents, then the event organizer in the admin. The audience picks the register, so the flow pages are generous and loud and the admin is tight and quiet.

## Palette (every pairing measured with the antislop contrast checker)

| Pair                                    | Ratio | Use                             | Verdict      |
| --------------------------------------- | ----- | ------------------------------- | ------------ |
| Ink `#2A2140` on Paper `#FFF8F0`        | 14.34 | body text                       | AA normal    |
| Ink on Card `#FFFDFA`                   | 14.88 | body text on raised cards       | AA normal    |
| Ink on Sky `#A8D8F0`                    | 9.89  | text on sky panels              | AA normal    |
| Ink on Blush `#F7C8D4`                  | 10.19 | text on blush panels            | AA normal    |
| Ink on Butter `#FFD98E`                 | 11.20 | primary button label            | AA normal    |
| Ink Soft `#5A4E72` on Paper             | 7.20  | secondary text                  | AA normal    |
| Sky Deep `#1F6E9C` on Paper             | 5.29  | links, small labels             | AA normal    |
| Blush Deep `#A83A5B` on Paper           | 5.83  | labels, error text              | AA normal    |
| Paper on Sky Deep                       | 5.29  | secondary button label          | AA normal    |
| Stage Text `#F5F0FF` on Stage `#241C3A` | 14.43 | text on the camera stage        | AA normal    |
| Stage Muted `#9A8CC2` on Stage          | 5.30  | secondary text on stage         | AA normal    |
| Butter on Stage                         | 11.95 | focus ring and accents on stage | AA normal    |
| Line `#8C7FA6` on Paper                 | 3.50  | control borders                 | non-text 3:1 |
| Line on Stage                           | 4.38  | control borders on stage        | non-text 3:1 |
| Sky Deep on Blush                       | 3.76  | focus ring over blush panels    | non-text 3:1 |
| Sky Deep on Butter                      | 4.13  | focus ring over the accent      | non-text 3:1 |
| Sky Deep on Sky                         | 3.65  | not for body text, large only   | large text   |
| Blush Deep on Blush                     | 4.14  | not for body text, large only   | large text   |

Rules that follow from the numbers:

- Text on a pastel surface is always Ink. The deep tones only sit on Paper or Card.
- Borders that bound a control use Line. Decorative dividers may be lighter.
- Focus ring: Ink, 3px, with a 2px Paper offset on light surfaces; Butter, 3px, on the stage.

## Typography

- Display: Fredoka 500/600. Round terminals and geometric circles match the ear motif, it reads friendly without being babyish, and it is a deliberate pick rather than a default (not Inter, not Geist).
- Body: Nunito Sans 400/600/700. Tall x-height and open counters stay readable on a phone in a bright room.
- Fluid clamp scale; body stays at or above 17px on the flow pages because children read larger. No uppercase tracking labels, no monospace.

## Motif

Three-circle "ears": one large circle with two smaller tangent circles on top. Used as list bullets, card corner marks, the step indicator, and the loading indicator (a real loading state, not decoration). Drawn as plain SVG geometry, never as character art.

## Shape and space

- Radius rule, applied everywhere: buttons pill; cards 24px; inputs 14px; chips 12px; frame thumbnails and strip previews 10px. Variation is deliberate so only buttons read as pills.
- Spacing: 8px base scale. Page gutters 20px on phones, 40px from tablet up. Sections size to content.
- Shadows: exactly one elevation, on the strip preview, because the strip is the object the product is about. Everything else sits flat.

## Surfaces

- Light pages: Paper base, Card surfaces, pastel panels (Sky, Blush, Butter) for grouped choices.
- The booth: dark Stage `#241C3A` with the video as the brightest object on screen, using scoped tokens. It is a stage, not a second theme.

## Motion (dial 2)

- Press feedback on every button: 1px translate and 0.98 scale.
- Greeting entrance: one staggered fade-up, plays once.
- Countdown numeral pops once per second; the flash is a 150ms white wash. Both are state indicators.
- Reduced motion removes every transform; state changes stay instant and visible.
- No endless loops anywhere on the site.

## Page compositions (RHYTHM 3)

- Greeting: poster composition, motif repeating behind one focal button, closing on a quiet how-it-works list and the event disclaimer.
- Template: strip preview large on one side, expectation copy on the other; stacks on phone.
- Booth: the stage leads, shot rail beside it on desktop and below it on phone.
- Customize: sticky live strip preview beside grouped controls.
- Admin: dense, quiet table register. The admin deliberately does not share the kid look beyond the tokens.

## Copy rules

- Short sentences, grade 2 reading level on the flow pages.
- No em dashes. No buzzwords, no invented numbers, no invented testimonials.
- CTAs name the action: "Start the booth", "Start the camera", "Take these photos again", "Use these photos", "Download my strip".

## Placeholders in this build (all visibly labeled, replaced before launch)

- Logo: the word "PhotoToy" as text, marked in code as a placeholder wordmark.
- Frames: one sample frame, tagged "Sample frame" in the picker until real overlays and manifest entries arrive.
- Sounds: silent until sound files are added; the mute control renders only when files exist.

## Reasons (one line each)

- Pastels on off-white with Ink text: keeps the surface bright for children while every measured pairing passes AA.
- Butter as the single accent: it marks the one action that matters on a screen, so it stays meaningful.
- Rounded display type: matches the ear motif and helps early readers.
- Dark stage: the camera is a performance, so the interface steps back and the child's face is the brightest thing on screen.
- Pill buttons only, varied radii elsewhere: children hit big round targets more reliably, and the rest of the system keeps its hierarchy.
- Ear motif: a repeatable, ownable shape that survives swapping the wordmark.
- Admin looks different on purpose: the organizer needs density and speed, not delight.
