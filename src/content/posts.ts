// Blog post source of truth. Add new posts here — sitemap.xml and the
// blog routes pick them up automatically.
//
// Keep `content` as semantic HTML (h2, p, ul, etc.) so the article route
// can render it directly and search engines get clean structure.

export interface BlogPost {
  slug: string;
  title: string;
  description: string; // <=160 chars, used for meta description + og
  publishedAt: string; // ISO date
  updatedAt?: string;  // ISO date, optional
  author: string;
  readingMinutes: number;
  tags: string[];
  /** Semantic HTML body. */
  content: string;
}

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-stop-wasting-food-at-home",
    title: "How to Stop Wasting Food at Home: 7 Habits That Actually Work",
    description:
      "Cut household food waste with seven practical habits — from a weekly fridge audit to smart receipt scanning and cooking from what you already have.",
    publishedAt: "2026-01-12",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 6,
    tags: ["food waste", "kitchen tips", "sustainability"],
    content: `
<p>The average household throws away roughly a third of the food it buys. Most of that waste isn't caused by laziness — it's caused by forgetting what's already in the fridge. Here are seven habits that move the needle, ranked from easiest to most powerful.</p>

<h2>1. Run a 60-second fridge audit twice a week</h2>
<p>Before you cook, open the fridge and scan the top two shelves. Pull anything wilting or close to expiring to the front. This single habit reclaims more food than any app ever will.</p>

<h2>2. Log groceries the moment they hit the counter</h2>
<p>The bag-to-shelf moment is when you remember what you bought. Snap a photo of the receipt or the fridge interior and let an inventory app like <strong>FridgeSpy</strong> catalog it for you in seconds.</p>

<h2>3. Cook from what you have, not from recipes</h2>
<p>Recipe sites push you to buy more ingredients. Flip the script: start from your inventory and ask "what can I make with these six things?" AI recipe tools are very good at this now.</p>

<h2>4. Treat the freezer as a save button</h2>
<p>Anything you bought but won't eat in 48 hours — bread, herbs, half an onion, leftover sauce — belongs in the freezer. Label it with a date.</p>

<h2>5. Set one expiry alert per high-risk item</h2>
<p>You don't need notifications for shelf-stable pasta. You do need them for berries, leafy greens, dairy, and anything opened. One alert per item is enough.</p>

<h2>6. Plan one "use-it-up" night each week</h2>
<p>Pick a night where the rule is "no shopping, cook only from the fridge." Stir-fries, frittatas, grain bowls, and pasta carry almost anything.</p>

<h2>7. Track your wins</h2>
<p>What gets measured gets reduced. A simple waste score — like the FridgeSpy Score — turns an abstract goal into a number you can move week over week.</p>

<h2>Where FridgeSpy fits</h2>
<p>FridgeSpy automates the steps that are easy to forget: it scans receipts and fridge photos to build your inventory, sends gentle expiry alerts, and generates recipes from what you actually have. Free to start, no credit card.</p>
`,
  },
  {
    slug: "ai-receipt-scanning-explained",
    title: "AI Receipt Scanning, Explained: How a Photo Becomes a Pantry List",
    description:
      "How modern receipt scanning works — from OCR to grocery-aware AI parsing — and why it's now accurate enough to replace manual kitchen inventory lists.",
    publishedAt: "2026-02-04",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["AI", "receipt scanning", "kitchen inventory"],
    content: `
<p>Five years ago, scanning a grocery receipt meant squinting at OCR output that confused "MILK 2%" with "M1LK Z%". Today, a single photo can become a structured pantry list in seconds. Here's how the pipeline works.</p>

<h2>Step 1: Image capture and cleanup</h2>
<p>The app straightens the receipt, boosts contrast, and removes shadows. This step alone improves accuracy more than any clever model can.</p>

<h2>Step 2: OCR — turning pixels into text</h2>
<p>Optical character recognition pulls the raw text. Modern OCR handles thermal-printed receipts, faded ink, and curled paper far better than the engines from a few years ago.</p>

<h2>Step 3: Grocery-aware parsing</h2>
<p>This is where AI earns its keep. A general model reads the messy text — abbreviations, store codes, weights — and maps each line to a real grocery item, a quantity, and a category. "BNNAS 1.2LB" becomes "Bananas, 1.2 lb, Produce."</p>

<h2>Step 4: Inventory write-back</h2>
<p>Each parsed item is added to your kitchen inventory with a sensible default expiry date based on the category. Bananas get five days, canned beans get two years.</p>

<h2>Why this matters for food waste</h2>
<p>Manual inventory apps fail because nobody types in 22 items after a grocery run. Automatic inventory works because the cost of using it drops to a single photo. That's the difference between an app you open once and an app you actually use.</p>

<h2>Try it</h2>
<p><strong>FridgeSpy</strong> does all four steps in about three seconds per receipt. <a href="/features">See the full feature list</a> or jump straight in.</p>
`,
  },
  {
    slug: "best-foods-to-meal-prep-for-busy-weeks",
    title: "The Best Foods to Meal Prep for Busy Weeks (That Won't Spoil)",
    description:
      "A practical list of meal-prep ingredients that stay fresh all week — plus how to mix and match them into dinners without a strict recipe.",
    publishedAt: "2026-03-18",
    author: "The FridgeSpy Team",
    readingMinutes: 7,
    tags: ["meal prep", "recipes", "kitchen tips"],
    content: `
<p>Meal prep fails when you cook seven identical containers on Sunday and stare at them by Wednesday. The fix isn't more discipline — it's prepping <em>components</em> that combine into different meals.</p>

<h2>Proteins that hold up</h2>
<ul>
  <li><strong>Roasted chicken thighs</strong> — stay juicy 4 days, work in bowls, tacos, salads.</li>
  <li><strong>Hard-boiled eggs</strong> — 7 days in the shell.</li>
  <li><strong>Lentils</strong> — cook a big batch, lasts 5 days, freezes well.</li>
  <li><strong>Marinated tofu</strong> — actually improves by day 3.</li>
</ul>

<h2>Grains and starches</h2>
<ul>
  <li><strong>Brown rice or farro</strong> — 5 days, reheats well with a splash of water.</li>
  <li><strong>Roasted sweet potatoes</strong> — 5 days, eat hot or cold.</li>
  <li><strong>Quinoa</strong> — 5 days, great cold base for salads.</li>
</ul>

<h2>Vegetables that don't turn to mush</h2>
<ul>
  <li><strong>Roasted broccoli, cauliflower, carrots</strong> — 5 days.</li>
  <li><strong>Shredded cabbage</strong> — 7 days raw, perfect for slaws and tacos.</li>
  <li><strong>Cherry tomatoes and cucumbers</strong> — leave whole, slice the day-of.</li>
</ul>

<h2>Sauces are the secret</h2>
<p>One protein + one grain + one vegetable + a different sauce each night = a different meal. Make two sauces on Sunday — a tahini-lemon and a soy-ginger — and you've covered six dinners.</p>

<h2>Don't lose track</h2>
<p>The reason prepped food gets thrown away is because it disappears into the back of the fridge. Logging it into <strong>FridgeSpy</strong> with an expiry alert means you actually eat it before it goes.</p>
`,
  },
  {
    slug: "expiry-dates-decoded",
    title: "Expiry Dates Decoded: Best-By vs Use-By vs Sell-By",
    description:
      "What food expiry labels actually mean, which ones are safety dates, and how to judge freshness when the printed date has passed.",
    publishedAt: "2026-04-22",
    author: "The FridgeSpy Team",
    readingMinutes: 4,
    tags: ["food safety", "expiry", "kitchen tips"],
    content: `
<p>One of the biggest sources of food waste is throwing things out the second a date passes. Most printed dates aren't safety dates at all — they're quality estimates from the manufacturer. Here's the cheat sheet.</p>

<h2>Best-by</h2>
<p>Peak quality, not safety. A yogurt past its best-by date is almost always fine for another week if it smells and looks normal.</p>

<h2>Use-by</h2>
<p>The closest thing to a real safety date. Take this one seriously for meat, poultry, fish, and ready-to-eat refrigerated items. For shelf-stable goods, it's still mostly about quality.</p>

<h2>Sell-by</h2>
<p>A signal to the store, not to you. Milk typically stays good 5–7 days past its sell-by date if it's been kept cold.</p>

<h2>How to judge for yourself</h2>
<ul>
  <li><strong>Smell first.</strong> Sour, ammonia, or rancid smells are a hard no.</li>
  <li><strong>Look.</strong> Slime on meat, fuzzy mold on soft cheese or berries, bulging cans — discard.</li>
  <li><strong>Taste a tiny bite.</strong> If it tastes off, stop.</li>
</ul>

<h2>Track expiry without obsessing</h2>
<p><strong>FridgeSpy</strong> sets sensible default expiries per category and nudges you a day or two before — not the moment the printed date hits. You decide what to cook, what to freeze, and what to skip.</p>
`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
