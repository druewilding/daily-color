# daily-color

Provides a unique hex code each day

## Install

Install from [npmjs.com/package/daily-color](https://www.npmjs.com/package/daily-color):

```bash
npm install daily-color
```

## Use

In a JavaScript/TypeScript project, using NPM:

```javascript
import { getDailyColor } from "daily-color";

console.log("Today's color is:", getDailyColor());
console.log("Another day's color is:", getDailyColor(new Date("2024-11-09")));
```

Colors that go with the day's color, worked out in OKLCH so they keep its lightness and strength (on gray days they get a little extra strength, so there's always some color):

```javascript
import { getDailyPalette, getPalette } from "daily-color";

const palette = getDailyPalette(); // or getDailyPalette(new Date("2024-11-09"))
palette.color; // the day's color, e.g. "#7ad2f9"
palette.contrast; // "#000000" or "#ffffff", whichever reads better on it
palette.complementary; // "#ffb086"
palette.splitComplementary; // ["#ffabac", "#ecbc6f"]
palette.analogous; // ["#5edbdf", "#a2c7ff"]
palette.triadic; // ["#fba8d1", "#cbcb74"]
palette.tetradic; // ["#e4aef3", "#ffb086", "#a1d691"]

getPalette("#3fa2c1"); // the same, for any color
```

Black or white text, whichever is easier to read on a color:

```javascript
import { contrastColor } from "daily-color";

contrastColor("#7ad2f9"); // "#000000"
contrastColor("#1935a4"); // "#ffffff"
```

Directly loading the bundled JavaScript, for static projects not using NPM:

```html
<script type="module">
  import { getDailyColor } from "https://www.druewilding.com/daily-color/dist/daily-color.js";

  console.log("Today's color is:", getDailyColor());
  console.log("Another day's color is:", getDailyColor(new Date("2024-11-09")));
</script>
```

Or as a plain script, which sets `window.DailyColor`. Plain scripts in `<head>` run before the page is drawn, so the color is there from the very first frame. Pin a version from jsDelivr so it never changes under you:

```html
<script src="https://cdn.jsdelivr.net/npm/daily-color@3/dist/daily-color.umd.js"></script>
<script>
  document.documentElement.style.setProperty("--day", DailyColor.getDailyColor());
</script>
```

### Building your own colors

The color tools behind the palette are there too, for making a whole theme from the day's color:

```javascript
import { contrastRatio, getDailyColor, oklch, readableOn, toOklch } from "daily-color";

const { l, c, h } = toOklch(getDailyColor()); // lightness 0–1, chroma 0–0.37, hue 0–360°
const pale = oklch(0.97, 0.02, h); // a background faintly tinted with the day's hue
const link = readableOn(getDailyColor(), pale); // darker or lighter until it reads at 4.5:1
contrastRatio(link, pale); // 4.5 or more

readableOn(getDailyColor(), "#ffffff", 7); // ask for more contrast
readableOn({ l: 0.9, c: 0.25, h }, "#ffffff"); // keep chroma that only fits once it's darker
```

`oklch()` brings the chroma down when a color doesn't fit in sRGB, so its lightness and hue stay true. `readableOn()` keeps the hue and chroma and only moves the lightness: darker on a light background, lighter on a dark one.

Using the CLI:

```bash
dailycolor                        # today's color
dailycolor complementary          # the color opposite it
dailycolor triadic analogous      # several, labeled
dailycolor all --date 2027-01-01  # everything, for another day
dailycolor --help                 # all the options
dailycolor --version
```

Just want to see today's color?

There is a demo on [www.druewilding.com/daily-color](https://www.druewilding.com/daily-color/)

Want to see a particular date? No problem, just add a `date` parameter, for example [www.druewilding.com/daily-color/?date=2025-01-29](https://www.druewilding.com/daily-color/?date=2025-01-29)

And if you want to see the coming colors for the next month you can see them on [www.druewilding.com/daily-color/month](https://www.druewilding.com/daily-color/month)

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm run test
```

Compile the dist code, for projects without NPM:

```bash
npm run webpack
```

The project uses ESLint and Prettier to ensure consistent coding standards.

```bash
npm run lint
npm run format
npm run package:lint
```

- `lint` will check for errors and fix formatting in `.ts` and `.js` files.
- `format` will apply format rules to all possible files.
- `package:lint` will warn of any inconsistencies in the `package.json` file.
