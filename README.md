# PhotoToy

A photobooth for children. A visitor takes four photos in the booth, picks a frame,
and downloads a printable 2 by 6 inch strip. The organizer keeps the originals in a
photo desk behind a login.

## The flow

| Route                | What happens                                                                 |
| -------------------- | ---------------------------------------------------------------------------- |
| `/`                  | Greeting: one button, "Start the booth"                                      |
| `/template`          | Shows what the strip will be, then "Start the camera"                        |
| `/booth`             | Live camera, mirror toggle, 3/5/10 second countdown, four photos, review     |
| `/customize`         | Swap photo order, pick a frame, watch the strip update, download the PNG     |
| `/admin`             | Photo desk: every visit with its originals, date filter, ZIP, delete         |
| `/admin/login`       | Organizer sign in                                                            |
| `/dev/measure-frame` | Frame tool: measures a frame file and writes its manifest entry (admin only) |

## Setup

1. **Install and run**

    ```bash
    npm install
    npm run dev
    ```

2. **Environment** (`.env.local`)

    | Variable                               | Where it comes from              |
    | -------------------------------------- | -------------------------------- |
    | `NEXT_PUBLIC_SUPABASE_URL`             | Supabase, project Connect dialog |
    | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase, project Connect dialog |

3. **Supabase project**
    - The migrations in `supabase/migrations/` create the tables, the row level
      security policies, the private `originals` bucket, and the session issuer.
      Apply them with the Supabase CLI (`supabase db push`) or by pasting them into
      the dashboard SQL editor.
    - **Turn off public signup** in Authentication, so only accounts you create can
      reach the photo desk.
    - Create the organizer account in Authentication, Users, Add user. Confirm the
      email, because no mail flow is wired up yet.

4. **Frames.** Drop a transparent image into `public/frames/` and add its entry to
   `public/frames/manifest.json`. The admin tool at `/dev/measure-frame` finds the
   photo windows and writes the entry for you. Details: `public/frames/README.md`.

5. **Sounds (optional).** Add `countdown-tick.mp3` and `shutter.mp3` to
   `public/sounds/`. Until the files exist the booth stays silent and the sound
   toggle stays hidden. Details: `public/sounds/README.md`.

## Layout of the strip

600 by 1800 px, which prints as 2 by 6 inches at 300 DPI. The export carries a real
300 DPI tag, so print software opens it at the right size. The frame sits on top of
the four photos, and each photo is cover cropped to the middle of its window.

## Commands

| Command                            | What it does                                                         |
| ---------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                      | Development server                                                   |
| `npm run build`                    | Production build                                                     |
| `npm run lint`                     | ESLint                                                               |
| `node scripts/verify-supabase.mjs` | Checks the public Supabase surface: what a visitor can and cannot do |

## Where things live

- `lib/render-strip.ts`: the one place a strip is drawn, shared by the live preview and the download
- `lib/capture.ts`: camera, mirroring, snapshots
- `lib/upload.ts`: saves the originals for the organizer
- `lib/frames.ts`: frame manifest
- `components/booth-context.tsx`: the photos, held in memory between the booth and the editor
- `proxy.ts`: session refresh, the admin gate, and the frame tool gate
- `DESIGN.md`: palette, type, dials, and the reason behind each
- `AGENTS.md`: working rules for AI agents on this repo (antislop is in use here)

## Notes

- Photos live in the browser until the visitor taps "Use these photos", so a retake
  never lands in the archive.
- A reload drops the photos on purpose, and the editor asks the visitor to start again.
- Everything visible that is not real yet is labelled as a placeholder: the text
  wordmark and the sample frame.
- Visitors never need an account, and the publishable key cannot read the archive:
  the policies allow writes to an open session only.
