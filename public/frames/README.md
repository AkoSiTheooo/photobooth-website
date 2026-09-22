# Frames

Each frame is one transparent image, 600 by 1800 px, plus one entry in `manifest.json`.
The transparent areas are the photo windows; everything opaque is the frame art that
covers the photos.

## Add a real frame

1. Drop the file here, for example `castle-strip.webp`.
2. Find its window rectangles, in pixels, measured from the top-left corner. Open
   `/dev/measure-frame` and sign in as the admin: it loads the file, scans the
   transparency, grows each opening to the 16:9 camera view, and prints a
   ready-to-paste manifest entry.
3. Paste the entry into the `frames` array in `manifest.json` and set `placeholder`
   to `false`.
4. Reload. The frame appears in the picker; no code change and no rebuild.

## Fields

| Field             | Meaning                                                     |
| ----------------- | ----------------------------------------------------------- |
| `key`             | Unique id, used in code only                                |
| `name`            | The label shown in the picker                               |
| `src`             | Path under `public/`                                        |
| `width`, `height` | Canvas size in px. 600 x 1800 prints as 2 x 6 in at 300 DPI |
| `layout`          | `strip4` today: four stacked photos                         |
| `placeholder`     | `true` shows a "Sample frame" tag in the picker             |
| `windows`         | Four rectangles, top to bottom: `x`, `y`, `w`, `h`          |

Photos are cover-cropped into the middle of each window. The booth shows the
camera at 16:9, so a window close to 16:9 keeps what the visitor saw; openings
further from 16:9 crop the photo harder, and the measure tool flags those.
