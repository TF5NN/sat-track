# TF5NN style guide

How Northbound, Sightline and Feedpoint look, written down so that they stay
alike and a new app starts out right. Northbound is the reference: this guide
describes Northbound as it is, and the other apps follow it. Where an app
differs from this page, the app is what should change.

The named shades below are defined at the top of `src/style.css`. Nothing in
the stylesheet or the components uses a colour that is not on this list.

## Principles

- Quiet, pale and green. The page is paper; information sits on it in small,
  calm type. Colour is for meaning (workable, a warning, a live pass), not for
  decoration.
- One accent: the brand green. Amber is for notes, warnings and "other radio",
  blue only for "listen", rust for errors.
- Numbers that are read off and typed into a radio are in the mono face.
  Everything else is in the sans face.
- Extras are quiet until asked for. A new feature must not change what the
  page looks like when it is first opened.

## Type

| Face                    | Used for                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| DM Sans (400–700)       | Headings, labels, running text, buttons                                          |
| IBM Plex Mono (400–600) | Times, frequencies, bearings, callsigns, grid squares, small figures in drawings |

- Small labels above fields and sections ("eyebrows") are capitals, weight 650,
  letter-spaced about 1 px, in `muted`.
- Headings are weight 550–600 with slightly tightened letter-spacing.
- The app name in the header is capitals, weight 700, letter-spaced 2.2 px.

## Colours

### Ink and text, darkest to lightest

| Name          | Value     | For                                                                                          |
| ------------- | --------- | -------------------------------------------------------------------------------------------- |
| `ink-deep`    | `#142f32` | The live satellite dot and the compass letters in the drawings; the darkest mark on the page |
| `ink`         | `#203b3d` | Headings, main figures, the default text colour                                              |
| `ink-soft`    | `#34503d` | Running text in dialogs; what is typed into a field                                          |
| `text-strong` | `#526d4d` | Text that matters but is not a heading                                                       |
| `text`        | `#628359` | Ordinary secondary text                                                                      |
| `text-cool`   | `#67816d` | The same, a little greyer: the summary strip, day headings, the data status                  |
| `text-muted`  | `#809078` | Supporting lines under a figure; most small print                                            |
| `muted`       | `#76847d` | Field labels and eyebrows                                                                    |
| `text-soft`   | `#96a288` | Units, captions, the quietest readable text                                                  |
| `text-faint`  | `#b2bda9` | Separators, row arrows, marks that should barely show                                        |

### Greens

| Name           | Value     | For                                                                             |
| -------------- | --------- | ------------------------------------------------------------------------------- |
| `green-dark`   | `#244c3d` | The primary button; the chosen option in a segmented control                    |
| `green`        | `#267c62` | The accent: focus rings, the slider, live readouts                              |
| `green-bright` | `#21806a` | The pass track and its end points in the drawings                               |
| `green-mid`    | `#417954` | The bar on the chosen pass, the tuned frequencies, links inside notes           |
| `green-light`  | `#5f9d77` | The "live" dot, the small pass arc, the full stop in the title                  |
| `green-vivid`  | `#60884e` | "Workable" badge text; links and emphasised words in the guide and instructions |
| `green-pale`   | `#bce3bc` | The logo mark on its dark tile                                                  |

### Amber, rust and blue

| Name         | Value     | For                                                                            |
| ------------ | --------- | ------------------------------------------------------------------------------ |
| `amber-ink`  | `#8a6a2f` | Text of a warning: "not heard recently", "rarely heard"                        |
| `amber-text` | `#8a7448` | Text of a data notice; "Other radio" badge text                                |
| `amber-fill` | `#b3945f` | Small solid amber marks: the "other radio" dot in the legend, a stale-data dot |
| `amber-line` | `#e0d7bd` | Border of an amber note                                                        |
| `amber-soft` | `#f7f1df` | Ground of an amber note or banner                                              |
| `amber-wash` | `#f0ebe0` | "Other radio" badge ground                                                     |
| `rust`       | `#a35d3c` | An error message                                                               |
| `blue-ink`   | `#647d98` | "Listen" badge text                                                            |
| `blue-fill`  | `#8397b1` | The "listen" dot in the legend                                                 |
| `blue-soft`  | `#e9edf2` | "Listen" badge ground                                                          |

### Lines, strongest to lightest

| Name          | Value     | For                                                                                      |
| ------------- | --------- | ---------------------------------------------------------------------------------------- |
| `line-accent` | `#adc5a4` | Border of the chosen pass                                                                |
| `line-green`  | `#d9e3d0` | Borders of buttons and cards                                                             |
| `line-strong` | `#d5dfd3` | Borders that must hold a shape: fields, header links, the pass panel, the sky plot's rim |
| `line`        | `#dfe5de` | The ordinary rule between things                                                         |

### Surfaces, darkest to lightest

| Name          | Value     | For                                                                |
| ------------- | --------- | ------------------------------------------------------------------ |
| `tint-strong` | `#e2eee0` | "Workable" badge ground; a highlighted patch                       |
| `tint-grey`   | `#e7ede4` | The track of a segmented control; an icon button under the pointer |
| `green-soft`  | `#e8f2e9` | A button under the pointer, a pressed toggle, the event banner     |
| `wash`        | `#edf0e7` | The summary strip and day headings; faint rules inside a card      |
| `tint`        | `#f0f3e9` | Patches set into a panel: the timing row, notes, the chosen pass   |
| `paper`       | `#f7f8f3` | The page                                                           |
| `surface`     | `#fcfdf8` | Dialogs, cards, fields and the pass panel                          |
| `white`       | `#fff`    | Buttons; the chosen option in a segmented control                  |

### Drawings (sky plot and look-around view)

| Name                | Value                | For                                 |
| ------------------- | -------------------- | ----------------------------------- |
| `sky`               | `#f4f7f2`            | The sky                             |
| `ground`            | `#b9c4b3`            | Terrain                             |
| `grid`              | `#d6dfd8`            | Elevation rings and direction lines |
| `sun`, `sun-edge`   | `#e9b84a`, `#c9962a` | The sun                             |
| `moon`, `moon-edge` | `#e6e9ee`, `#9aa5b1` | The moon                            |

### Overlays and shadows

| Name                    | Value                    | For                              |
| ----------------------- | ------------------------ | -------------------------------- |
| `backdrop`              | `#16332970`              | Behind a dialog                  |
| `scrim`                 | `#1d3e2a80`              | Behind the pass panel on a phone |
| `shadow-deep`           | `#0a251c30`              | Under a dialog                   |
| `shadow`, `shadow-soft` | `#28422c13`, `#2342230b` | Under cards and panels           |
| `shadow-black`          | `#0006`                  | Under map pins                   |

## Each app's own colours

The shades above are copied, as one block, to the top of each app's stylesheet.
An app may add colours of its own below that block when they mean something
only that app has. They are kept few, and they are listed here.

| App       | Name                          | Value                           | For                                                                          |
| --------- | ----------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| Sightline | `path`                        | `#2f6fb7`                       | The line of sight, on the map and the chart; point B in the look-around view |
| Sightline | `good`                        | `#2e8b57`                       | A station that should work                                                   |
| Sightline | `marginal`, `marginal-ink`    | `#d98a00`, `#b87400`            | Grazing ground; a marginal station; its text                                 |
| Sightline | `bad`, `bad-line`, `bad-soft` | `#c0392b`, `#eec2bb`, `#f8dcd8` | Blocked ground; an unlikely station; an error and its box                    |
| Feedpoint | `blue`, `gold`, `violet`      | `#2f6fb7`, `#b08d1e`, `#8a56c2` | Marks on the graph's controls                                                |

Feedpoint's curves take their colours from the band list in its script, and
Sightline's chart and map lines are set in its script too. Those are data
colours and are not named here.

## Shared pieces

| Piece       | How it is made                                                                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header      | 90 px tall, a rule (`line`) underneath, 46 px of space at the sides. Left: the logo tile (`ink` with a `green-pale` mark), the app name and a one-line description. Right: bordered links "TF5NN ↗" and "GitHub ↗" in the mono face |
| Button      | White, 1 px `line-green` border, 5 px corners, small sans text, icon to the left of the words. The primary one is `green-dark`                                                                                                      |
| Header link | Mono 13 px, weight 500, 1 px `line-strong` border, 4 px corners                                                                                                                                                                     |
| Field       | `surface`, `line-strong` border, 5 px corners; its label above it as an eyebrow in `muted`                                                                                                                                          |
| Badge       | 4 px corners, very small type, an icon and one or two words: Workable (`tint-strong` / `green-vivid`), Listen (`blue-soft` / `blue-ink`), Other radio (`amber-wash` / `amber-text`)                                                 |
| Dialog      | `surface`, 12 px corners, 32 px inside, a deep soft shadow, over `backdrop`. Close button top right. Escape closes it and focus stays inside                                                                                        |
| Note        | A rounded patch of `tint` (information) or `amber-soft` (warning) with an icon at the left                                                                                                                                          |
| Toggle pill | A small rounded-off button under a drawing; pressed, it turns `green-soft`                                                                                                                                                          |

Corners are 4–5 px on controls, 8–12 px on panels and dialogs, and fully round
on dots and pills.

## Layout

The page is at most 1600 px wide. Below 1190 px the three columns start to
fold; below 1000 px the pass panel moves under the list; below 720 px the
layout is a single column and the pass panel opens over the page.

## Dark mode (decided, not yet built)

- It follows the device's setting by default.
- There is also a small, visible button for it in the header of each app. A
  choice made there is remembered in that browser and wins over the device.
- It is made by giving every named shade above a second value. No component
  gets its own dark colour.

## Changing this guide

Add a named shade only when no existing one will do, and add it here in the
same change. When Northbound's look changes on purpose, this page changes with
it and the other apps follow.
