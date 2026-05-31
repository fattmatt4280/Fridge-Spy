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
    slug: "why-a-clean-fridge-saves-money",
    title: "Why a Clean Fridge Saves You $1,500 a Year",
    description:
      "Learn how an organized refrigerator cuts food waste, reduces impulse buys, and keeps your weekly grocery bill under control.",
    publishedAt: "2026-01-05",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["food waste", "kitchen tips", "fridge organization", "saving money"],
    content: `
<p>The average family of four spends about $150 per week on groceries — and throws away roughly $30 of it. Over a year, that is more than $1,500 going straight into the trash. The single biggest fix? A clean, organized fridge.</p>

<h2>Out of sight, out of mind</h2>
<p>When produce is buried behind condiments and leftovers are stacked behind milk cartons, you forget what you have. The result: duplicate purchases, spoiled food, and a fridge that smells suspicious. Visibility is everything.</p>

<h2>Organize by expiry, not by type</h2>
<p>Most people group dairy with dairy and vegetables with vegetables. A better system: front-to-back by expiry date. The item that needs eating first lives at the front of its shelf. No more discovering a soggy lettuce bag three weeks later.</p>

<h2>Label your zones</h2>
<p>Designate shelves for specific purposes: one for "eat this week," one for "long storage," and a drawer for "freeze or cook soon." The visual cue keeps everyone in the household aligned without constant reminders.</p>

<h2>Clean before you shop</h2>
<p>The best time to tidy your fridge is right before a grocery run. You see exactly what you still have, what is about to turn, and what gaps actually need filling. That clarity alone prevents overspending.</p>

<h2>How FridgeSpy helps</h2>
<p>FridgeSpy turns your fridge into a dashboard. Snap a photo and it catalogs what you have, estimates expiry dates, and surfaces items you should use first — so nothing hides in the back row again.</p>
`,
  },
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
    slug: "weekly-kitchen-reset-routine",
    title: "The 15-Minute Weekly Kitchen Reset That Changes Everything",
    description:
      "A simple weekly reset routine that keeps your kitchen organized, your fridge visible, and your food waste close to zero — in just fifteen minutes.",
    publishedAt: "2026-01-19",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 4,
    tags: ["kitchen tips", "fridge organization", "meal planning"],
    content: `
<p>The difference between a kitchen that runs smoothly and one that breeds waste is not perfection — it is a 15-minute weekly reset. Done consistently, this short routine prevents the Sunday-evening fridge purge that sends half your groceries to the bin.</p>

<h2>Minute 1–3: Clear the counters</h2>
<p>Put away anything that does not belong. Mail, chargers, empty containers, and mystery Tupperware all migrate to their proper homes. A clear counter is a clear mind.</p>

<h2>Minute 4–7: Fridge front-to-back scan</h2>
<p>Open every shelf and drawer. Move wilting items to a "use first" shelf. Toss anything that has actually spoiled — not just past a printed date, but truly bad. Wipe up spills while you are in there.</p>

<h2>Minute 8–11: Check the freezer and pantry</h2>
<p>Note what is running low and what has been forgotten. Rotate older frozen items forward. Add staples to your shopping list only if you are genuinely out.</p>

<h2>Minute 12–15: Plan three meals from what you have</h2>
<p>You do not need a full week of recipes. Just three meals that use ingredients already in the house. That alone prevents three nights of "I have nothing to eat" ordering.</p>

<h2>Make it automatic</h2>
<p>Pair the reset with an existing habit — Sunday morning coffee, Wednesday trash night, whatever anchors your week. FridgeSpy can send a gentle weekly reminder with a summary of what needs using first.</p>
`,
  },
  {
    slug: "ai-smart-kitchen-tools-2026",
    title: "AI in the Kitchen: How Smart Tools Are Changing Home Cooking in 2026",
    description:
      "From AI recipe generators to smart inventory apps, discover how artificial intelligence is making home cooking faster, cheaper, and less wasteful.",
    publishedAt: "2026-01-26",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["AI", "kitchen tips", "food waste", "smart home"],
    content: `
<p>Artificial intelligence is no longer confined to chatbots and code editors. In 2026, it is quietly revolutionizing the way we cook, shop, and manage our kitchens — and the biggest winner is the home cook trying to waste less.</p>

<h2>AI recipe generation from pantry items</h2>
<p>Instead of searching for recipes and then buying ingredients, you can now list what you have and get tailored recipes instantly. Modern AI understands flavor pairings, dietary restrictions, and cuisine styles — turning "eggs, spinach, and feta" into five distinct dishes.</p>

<h2>Smart receipt and image scanning</h2>
<p>Take a photo of your grocery receipt or your fridge interior and AI extracts every item, categorizes it, and estimates expiry dates. The accuracy gap between 2021 and 2026 is staggering. Thermal-printed receipts, handwritten labels, and crumpled bags are all handled reliably now.</p>

<h2>Predictive shopping lists</h2>
<p>Some apps now learn your household patterns — how fast you go through milk, when you typically restock produce — and suggest shopping lists before you realize you are running low.</p>

<h2>The waste reduction angle</h2>
<p>AI does not just save time. By surfacing what you already own, suggesting recipes that use it, and alerting you before expiry, these tools attack food waste at its root cause: forgetting what you have.</p>

<h2>Try FridgeSpy</h2>
<p>FridgeSpy combines receipt scanning, AI recipe generation, and expiry tracking in one app. Free to start, built for real kitchens.</p>
`,
  },
  {
    slug: "pantry-essentials-always-have",
    title: "Pantry Essentials: The 20 Ingredients You Should Always Have",
    description:
      "Build a versatile home pantry with these 20 staple ingredients — so you can cook almost anything without an emergency grocery run.",
    publishedAt: "2026-02-02",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 6,
    tags: ["kitchen tips", "meal prep", "pantry"],
    content: `
<p>The secret to cooking more and shopping less is a well-stocked pantry. With the right staples on hand, you can turn a few fresh additions into dozens of meals. Here are the 20 ingredients that give you the most flexibility.</p>

<h2>Oils and acids</h2>
<ul>
  <li><strong>Olive oil</strong> — for cooking and dressing.</li>
  <li><strong>Sesame oil</strong> — instant depth for Asian-inspired dishes.</li>
  <li><strong>Soy sauce</strong> — umami backbone for marinades and stir-fries.</li>
  <li><strong>Vinegar</strong> — red wine or apple cider, for deglazing and salads.</li>
  <li><strong>Lemon juice</strong> — bottled is fine; brightens almost anything.</li>
</ul>

<h2>Dry goods</h2>
<ul>
  <li><strong>Rice</strong> — long-grain or basmati, the ultimate blank canvas.</li>
  <li><strong>Pasta</strong> — a shape that holds sauce, like penne or fusilli.</li>
  <li><strong>Lentils</strong> — cook in 20 minutes, no soaking required.</li>
  <li><strong>Canned tomatoes</strong> — the base of a hundred sauces.</li>
  <li><strong>Stock cubes</strong> — chicken or vegetable, for instant broth.</li>
</ul>

<h2>Seasonings and aromatics</h2>
<ul>
  <li><strong>Salt and pepper</strong> — non-negotiable.</li>
  <li><strong>Garlic and onion powder</strong> — backup when fresh runs out.</li>
  <li><strong>Cumin and paprika</strong> — two spices that cover many cuisines.</li>
  <li><strong>Dried oregano</strong> — more versatile than you think.</li>
</ul>

<h2>Long-lasting fridge staples</h2>
<ul>
  <li><strong>Eggs</strong> — breakfast, baking, and emergency dinner.</li>
  <li><strong>Butter</strong> — lasts weeks, transforms flavor.</li>
  <li><strong>Hard cheese</strong> — parmesan or aged cheddar, months of life.</li>
  <li><strong>Greek yogurt</strong> — breakfast, marinades, and sauces.</li>
  <li><strong>Frozen vegetables</strong> — peas, spinach, or mixed bags.</li>
</ul>

<h2>Track it without stress</h2>
<p>A pantry this flexible only works if you know what is actually in it. FridgeSpy can scan your shelves and remind you when staples are running low — so you are never out of rice on a Tuesday night.</p>
`,
  },
  {
    slug: "ai-receipt-scanning-explained",
    title: "AI Receipt Scanning, Explained: How a Photo Becomes a Pantry List",
    description:
      "How modern receipt scanning works — from OCR to grocery-aware AI parsing — and why it's now accurate enough to replace manual kitchen inventory lists.",
    publishedAt: "2026-02-04",
    updatedAt: "2026-05-30",
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
<p><strong>FridgeSpy</strong> does all four steps in about three seconds per receipt. <a href="/app">See the full feature list</a> or jump straight in.</p>
`,
  },
  {
    slug: "batch-cooking-for-beginners",
    title: "Batch Cooking for Beginners: Start Small, Waste Less",
    description:
      "A beginner-friendly guide to batch cooking that focuses on simple prep, flexible meals, and ingredients that stay fresh all week.",
    publishedAt: "2026-02-09",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["meal prep", "kitchen tips", "recipes"],
    content: `
<p>Batch cooking does not mean eating the same thing for five days straight. The best approach is component-based: prep versatile building blocks on Sunday, then mix and match through the week. Here is how to start without overwhelming yourself.</p>

<h2>Start with one protein and one grain</h2>
<p>Cook a big batch of rice or quinoa and a tray of roasted chicken thighs. That alone gives you the base for grain bowls, tacos, salads, and stir-fries. Two ingredients, five meals.</p>

<h2>Prep vegetables raw, not cooked</h2>
<p>Instead of roasting everything on Sunday, wash and chop vegetables and store them raw. They last longer, taste fresher, and let you choose how to cook them each night — roasted, steamed, or tossed into a hot pan.</p>

<h2>Make one sauce, not five</h2>
<p>A single good sauce transforms any combination. A jar of lemon-tahini dressing or spicy peanut sauce turns plain rice and chicken into something you actually want to eat on Wednesday.</p>

<h2>Container strategy</h2>
<p>Use clear containers so you can see what you have. Label with contents and date. Keep prepped ingredients separate until the day you eat them — mixed bowls get soggy faster.</p>

<h2>Track your prep</h2>
<p>The biggest batch-cooking failure is forgetting what you prepped. Log your components in FridgeSpy with expiry alerts and you will never discover a container of beans at the back of the fridge on Friday.</p>
`,
  },
  {
    slug: "store-produce-last-longer",
    title: "How to Store Fresh Produce So It Lasts Twice as Long",
    description:
      "Simple storage tricks for fruits and vegetables — from humidity drawers to breathable bags — that extend freshness and cut spoilage in half.",
    publishedAt: "2026-02-16",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["kitchen tips", "food waste", "produce"],
    content: `
<p>Most produce waste comes from storage mistakes, not buying too much. The fridge is not a uniform environment — different vegetables need different conditions. Here is how to give everything its best chance.</p>

<h2>Use your humidity drawers correctly</h2>
<p>The high-humidity drawer is for leafy greens, herbs, and vegetables that wilt — spinach, lettuce, broccoli, carrots. The low-humidity drawer is for fruits and vegetables that rot with too much moisture — apples, peppers, grapes, mushrooms.</p>

<h2>Remove tight plastic</h2>
<p>Grocery store plastic traps condensation and accelerates mold. Transfer berries and greens to breathable containers or loosely wrapped paper towels inside a perforated bag.</p>

<h2>Separate ethylene producers</h2>
<p>Apples, bananas, avocados, and tomatoes release ethylene gas that ripens — and spoils — nearby produce. Store them away from leafy greens and berries, or keep them in a bowl on the counter instead.</p>

<h2>Do not wash until you use</h2>
<p>Water on the surface invites mold. Wash berries, greens, and herbs right before eating, not when you unpack the groceries.</p>

<h2>Know what belongs on the counter</h2>
<p>Tomatoes, bananas, onions, garlic, potatoes, and winter squash lose flavor and texture in the fridge. A cool, dark pantry or counter spot is better.</p>

<h2>Let FridgeSpy track it</h2>
<p>FridgeSpy sets category-aware expiry dates when you scan your groceries — berries at 4 days, carrots at 3 weeks — so you get alerts based on how each item actually behaves.</p>
`,
  },
  {
    slug: "leftover-makeovers-new-meals",
    title: "Leftover Makeovers: Turn Last Night's Dinner Into Something New",
    description:
      "Creative ways to repurpose common leftovers — from roasted chicken to cooked rice — into entirely different meals so nothing goes to waste.",
    publishedAt: "2026-02-23",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["recipes", "kitchen tips", "food waste"],
    content: `
<p>Leftovers are not failed meals — they are head starts. With the right approach, last night's dinner becomes the foundation for something completely different. Here are the best transformations for common leftovers.</p>

<h2>Roasted chicken → five new meals</h2>
<ul>
  <li><strong>Chicken salad</strong> — shred with mayo, mustard, celery.</li>
  <li><strong>Fried rice</strong> — dice and toss into day-old rice with soy and sesame.</li>
  <li><strong>Quesadillas</strong> — chopped with cheese and salsa.</li>
  <li><strong>Soup</strong> — simmer bones for broth, add vegetables and noodles.</li>
  <li><strong>Pasta bake</strong> — mix with tomato sauce, mozzarella, and penne.</li>
</ul>

<h2>Cooked rice → three directions</h2>
<ul>
  <li><strong>Fried rice</strong> — the classic, best with day-old cold rice.</li>
  <li><strong>Rice pudding</strong> — simmer with milk, sugar, and cinnamon.</li>
  <li><strong>Stuffed peppers</strong> — mix with beans, tomatoes, and cheese.</li>
</ul>

<h2>Roasted vegetables → new forms</h2>
<p>Leftover roasted broccoli, carrots, or squash become frittata fillings, grain bowl toppings, or blended into soup. Puree with stock for an instant creamy vegetable soup.</p>

<h2>The mindset shift</h2>
<p>Stop asking "what is this?" and start asking "what could this become?" That single reframe turns a fridge of random containers into a buffet of possibilities.</p>

<h2>Never lose a leftover</h2>
<p>FridgeSpy logs leftovers with custom expiry dates and suggests recipes based on what you have — including yesterday's dinner.</p>
`,
  },
  {
    slug: "true-cost-of-food-waste",
    title: "The True Cost of Food Waste: Your Wallet and the Planet",
    description:
      "Food waste costs the average household over $1,800 per year and generates more greenhouse gases than most countries. Here is the full picture.",
    publishedAt: "2026-03-02",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 6,
    tags: ["food waste", "sustainability", "saving money"],
    content: `
<p>We think of food waste as a personal habit problem. It is not. It is an economic and environmental crisis that happens to take place inside our kitchens. Here is what throwing away food actually costs — beyond the obvious.</p>

<h2>The household bill</h2>
<p>The average American family of four discards between $1,500 and $2,200 of food every year. That is not just spoiled produce — it is uneaten leftovers, expired dairy, impulse-bought ingredients for recipes never made, and forgotten items pushed to the back of the fridge.</p>

<h2>The hidden costs</h2>
<p>Every wasted item carried a cost before it reached you: farming, water, fertilizer, transport, refrigeration, and packaging. When you throw away a tomato, you are also throwing away the 3.3 gallons of water it took to grow it. When you bin beef, the environmental footprint is even larger — livestock farming is one of the most resource-intensive food systems on Earth.</p>

<h2>The climate impact</h2>
<p>If food waste were a country, it would be the third-largest emitter of greenhouse gases in the world, behind only China and the United States. Decomposing food in landfills releases methane, a greenhouse gas roughly 25 times more potent than carbon dioxide over a 100-year period.</p>

<h2>What one household can do</h2>
<p>The problem is systemic, but the fix starts at home. Reducing personal food waste by even 30 percent — a very achievable goal with basic planning and tracking — saves roughly $600 per year and prevents hundreds of pounds of CO2-equivalent emissions.</p>

<h2>FridgeSpy as a reduction tool</h2>
<p>FridgeSpy is built around one idea: you cannot reduce what you cannot see. By making your inventory visible, your expiry dates explicit, and your recipes based on what you own, it turns awareness into action.</p>
`,
  },
  {
    slug: "smart-grocery-lists-buy-less",
    title: "Smart Grocery Lists: Buy Less, Cook More",
    description:
      "How to build a smarter grocery list that matches your actual inventory, reduces impulse buys, and makes weeknight cooking easier.",
    publishedAt: "2026-03-09",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["kitchen tips", "meal planning", "saving money"],
    content: `
<p>The grocery list is the front line of food waste. A bad list sends you home with ingredients you already own and forgets the ones you actually need. A smart list does the opposite: it is built from your kitchen, not from memory.</p>

<h2>Start with inventory, not cravings</h2>
<p>Before writing anything, check what you have. The number one cause of duplicate purchases is guessing. A quick fridge and pantry scan — or a glance at your FridgeSpy dashboard — tells you what is already in stock.</p>

<h2>Plan meals, then list ingredients</h2>
<p>Decide on three to five meals for the week. Write down only the ingredients those meals require that you do not already have. This prevents the "just in case" buying that fills pantries with unused items.</p>

<h2>Group by store layout</h2>
<p>Organize your list by the path you take through the store: produce first, then dairy, then dry goods, then frozen. The less you backtrack, the less you are tempted by end-cap displays.</p>

<h2>Build in flexibility</h2>
<p>Leave one meal slot open for "use it up" — whatever needs eating from the fridge. This prevents waste and keeps your plan realistic when life gets busy.</p>

<h2>Keep a running list</h2>
<p>When you finish the olive oil, add it to the list immediately. Waiting until shopping day guarantees you will forget. FridgeSpy can auto-suggest items running low based on your scan history.</p>
`,
  },
  {
    slug: "freezer-hacks-stop-waste",
    title: "Freezer Hacks: Stop Throwing Away Freezable Food",
    description:
      "A practical guide to what freezes well, how to package it, and how long it lasts — so you can save food instead of throwing it away.",
    publishedAt: "2026-03-16",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["kitchen tips", "food waste", "freezer"],
    content: `
<p>The freezer is the most underused tool in the fight against food waste. Most households treat it as a place for ice cream and frozen pizza. Used properly, it is a time machine for freshness. Here is what to freeze, how to freeze it, and how long it lasts.</p>

<h2>Breads and baked goods</h2>
<p>Sliced bread, bagels, muffins, and tortillas all freeze beautifully. Wrap tightly in foil or a freezer bag and thaw at room temperature or in a toaster. Most breads last 2–3 months frozen.</p>

<h2>Dairy</h2>
<p>Hard cheese freezes well if grated first. Milk can be frozen but separates slightly — best used for cooking, not drinking. Butter freezes for up to 9 months without any texture change.</p>

<h2>Produce</h2>
<p>Berries, peeled bananas, chopped onions, peppers, spinach, and herbs all freeze well. For vegetables, blanching first preserves color and texture. For herbs, chop and freeze in oil in an ice cube tray.</p>

<h2>Cooked grains and beans</h2>
<p>Rice, quinoa, lentils, and beans freeze in single portions and reheat in minutes. Portion into flat freezer bags for fast thawing.</p>

<h2>Soups, sauces, and stocks</h2>
<p>Freeze in 1- or 2-cup portions in freezer bags laid flat. They stack neatly and thaw quickly in a bowl of warm water.</p>

<h2>Label everything</h2>
<p>The freezer graveyard is full of unlabeled containers. Write contents and date on every bag. FridgeSpy can track frozen items with custom expiry dates so nothing gets lost in the ice.</p>
`,
  },
  {
    slug: "best-foods-to-meal-prep-for-busy-weeks",
    title: "The Best Foods to Meal Prep for Busy Weeks (That Won't Spoil)",
    description:
      "A practical list of meal-prep ingredients that stay fresh all week — plus how to mix and match them into dinners without a strict recipe.",
    publishedAt: "2026-03-18",
    updatedAt: "2026-05-30",
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
    slug: "spring-kitchen-zero-waste",
    title: "Spring Cleaning Your Kitchen: A Zero-Waste Approach",
    description:
      "Declutter your kitchen this spring without creating more waste — from composting old food to donating unopened pantry items you will never use.",
    publishedAt: "2026-03-23",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["kitchen tips", "sustainability", "organization"],
    content: `
<p>Spring cleaning the kitchen often ends with trash bags full of expired food and guilty feelings. It does not have to. A zero-waste kitchen cleanout means dealing with what you have responsibly, then setting up systems so you do not face the same mess next year.</p>

<h2>Start with the fridge: sort, do not trash</h2>
<p>Pull everything out and sort into four piles: still good, needs cooking now, compostable, and trash. You will be surprised how much is still usable. The "needs cooking now" pile becomes your challenge ingredients for the week.</p>

<h2>Pantry: check dates, not assumptions</h2>
<p>Canned goods and dry goods are often fine well past their printed dates. Smell, look, and taste before discarding. Unopened items you know you will not eat — donate them to a food bank.</p>

<h2>Freezer: inventory and rotate</h2>
<p>Write down everything in your freezer. Toss anything with severe freezer burn. Move older items to the front. Commit to eating three frozen items this week.</p>

<h2>Compost what cannot be saved</h2>
<p>Vegetable scraps, expired produce, and stale bread all belong in compost, not landfill. If you do not have curbside compost, start a small bin or find a community drop-off.</p>

<h2>Set up prevention systems</h2>
<p>The real win is not needing a dramatic cleanout next year. A weekly reset, a visible inventory, and smarter shopping lists prevent accumulation. FridgeSpy helps you maintain a live inventory so nothing gets forgotten in the first place.</p>
`,
  },
  {
    slug: "cooking-for-one-without-waste",
    title: "Cooking for One Without the Waste",
    description:
      "Practical strategies for solo cooks to buy, store, and prepare food in portions that make sense for one person — without constant leftovers.",
    publishedAt: "2026-03-30",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["kitchen tips", "meal planning", "food waste"],
    content: `
<p>Cooking for one is harder than cooking for four. Most recipes serve four, most produce is bundled for families, and buying in bulk is not a deal if half of it rots. Here is how to shop, store, and cook for one without generating constant waste.</p>

<h2>Buy from the bulk section</h2>
<p>Rice, lentils, oats, nuts, and spices from bulk bins let you buy exactly what you need. You pay for a cup of quinoa, not a bag that sits in your pantry for two years.</p>

<h2>Embrace the freezer as portion control</h2>
<p>Divide meat, bread, and grated cheese into single portions before freezing. Pull out exactly what you need. A loaf of bread lasts months when sliced and frozen — and a single slice toasts in seconds.</p>

<h2>Halve recipes intentionally</h2>
<p>Most recipes scale down easily. Keep a reference: half an egg is about 2 tablespoons of beaten egg. Use smaller pans so halved recipes cook properly — a single chicken breast in a 12-inch skillet will dry out.</p>

<h2>Shop twice a week</h2>
<p>Smaller, more frequent shopping trips beat one giant weekly haul. You buy what you will actually eat in three days, not what you hope you might eat in seven.</p>

<h2>Track portions in your inventory</h2>
<p>FridgeSpy lets you log quantities and portions, not just item names. Know exactly how much chicken you have left and when it needs cooking — so solo cooking stays simple and waste-free.</p>
`,
  },
  {
    slug: "understanding-food-labels-beyond-dates",
    title: "Understanding Food Labels: Beyond the Expiry Date",
    description:
      "What food packaging labels really mean — from sell-by to best-before — and how to judge freshness using your senses instead of printed dates.",
    publishedAt: "2026-04-06",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["food safety", "expiry", "kitchen tips"],
    content: `
<p>Food labels are not as straightforward as they seem. Printed dates are manufacturer estimates, not hard safety rules. Learning what each label means — and when to trust your senses instead — saves food and money.</p>

<h2>Sell-by: for the store, not you</h2>
<p>"Sell-by" tells retailers how long to display a product. It is not a safety date. Milk is typically fine 5 to 7 days past its sell-by date if kept cold. Eggs last 3 to 5 weeks.</p>

<h2>Best-by: quality, not safety</h2>
<p>"Best-by" indicates when a product is at peak flavor or texture. Cereal, pasta, and canned goods are almost always safe well past this date. The quality may decline slightly — a cracker might be less crisp — but it is not dangerous.</p>

<h2>Use-by: the closest thing to a deadline</h2>
<p>"Use-by" is the most conservative label. Take it seriously for fresh meat, poultry, fish, and ready-to-eat refrigerated foods. For shelf-stable goods, it is still mostly about quality, not danger.</p>

<h2>Packaged on or born on dates</h2>
<p>Some items show when they were packaged rather than when they expire. Bread, meat, and some dairy products use these. They are helpful for judging freshness in stores, but they do not tell you when something has actually gone bad.</p>

<h2>Trust your senses first</h2>
<p>Smell, look, and taste a small bite. Sour milk, rancid meat, moldy soft cheese, or slimy vegetables are hard noes. If it looks fine, smells fine, and tastes fine, it almost certainly is fine — regardless of what the label says.</p>

<h2>Smarter tracking with FridgeSpy</h2>
<p>FridgeSpy uses category-based expiry logic rather than rigid printed dates. It nudges you based on how an item actually behaves, not an arbitrary stamp — so you waste less without gambling on safety.</p>
`,
  },
  {
    slug: "sustainable-kitchen-swaps",
    title: "Sustainable Kitchen Swaps: Small Changes, Big Impact",
    description:
      "Easy, affordable swaps for single-use kitchen items that reduce waste, save money, and make your cooking routine more sustainable.",
    publishedAt: "2026-04-13",
    updatedAt: "2026-05-30",
    author: "The FridgeSpy Team",
    readingMinutes: 5,
    tags: ["sustainability", "kitchen tips", "food waste"],
    content: `
<p>Sustainability in the kitchen does not require a complete lifestyle overhaul. A handful of simple swaps eliminates the most wasteful single-use items without adding hassle. Here are the changes that give the biggest return for the least effort.</p>

<h2>Swap paper towels for Swedish dishcloths</h2>
<p>One Swedish dishcloth replaces 17 rolls of paper towels. They absorb like sponges, dry like cloths, and last months. Toss them in the washing machine or dishwasher to clean.</p>

<h2>Swap plastic wrap for beeswax wraps</h2>
<p>Beeswax wraps mold around bowls, sandwiches, and cheese with the warmth of your hands. They are washable, reusable for about a year, and compostable at end of life.</p>

<h2>Swap single-use food storage for glass containers</h2>
<p>Glass containers last forever, do not stain or hold odors, and go from freezer to microwave without melting. The upfront cost is higher, but they pay for themselves within months.</p>

<h2>Swap disposable water bottles for a filter pitcher</h2>
<p>If your tap water is safe but tastes off, a filter pitcher eliminates the need for bottled water entirely. One filter cartridge replaces hundreds of plastic bottles.</p>

<h2>Swap pre-packaged snacks for bulk buying</h2>
<p>Individual snack packs generate enormous packaging waste. Buy nuts, dried fruit, and crackers in bulk and portion them into reusable containers or bags.</p>

<h2>Swap the mindset</h2>
<p>The most impactful swap is mental: from "what do I need to buy?" to "what do I already have?" FridgeSpy makes that shift easy by showing your live inventory at a glance — no new gadgets required.</p>
`,
  },
  {
    slug: "expiry-dates-decoded",
    title: "Expiry Dates Decoded: Best-By vs Use-By vs Sell-By",
    description:
      "What food expiry labels actually mean, which ones are safety dates, and how to judge freshness when the printed date has passed.",
    publishedAt: "2026-04-22",
    updatedAt: "2026-05-30",
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
