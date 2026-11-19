/**
 * Demo catalog: home decor & kitchen essentials. Image names refer to files produced by
 * `scripts/fetch-images.ts` (see `scripts/image-manifest.ts`) under `storefront/public/images/`.
 */

export type SeedOptionValue = { value: string; swatchHex?: string; surchargeCents?: number };
export type SeedOption = { name: string; values: SeedOptionValue[] };

export type SeedProduct = {
  slug: string;
  title: string;
  category: CategorySlug;
  priceCents: number;
  compareAtCents?: number;
  summary: string;
  description: string;
  dimensions: string;
  materials: string;
  care: string;
  tags: string[];
  featured?: boolean;
  /** Days ago the product was published (drives "newest" sort and the NEW badge). */
  ageDays: number;
  salesCount: number;
  /** Image names (manifest), first is the lead image, second the hover image. */
  images: string[];
  /** Up to two option groups; variants are the cartesian product. */
  options?: SeedOption[];
  /** Stock overrides keyed by "Value/Value" (or a single value, or "default"). */
  stock?: Record<string, number>;
};

export const CATEGORIES = [
  {
    slug: "side-tables",
    name: "Side & Accent Tables",
    description:
      "Small tables with big presence — bedside, sofa-side and coffee tables in honest materials.",
    image: "categories/side-tables",
  },
  {
    slug: "vases-decor",
    name: "Vases & Decor",
    description:
      "Ceramic vases, woven baskets and the finishing touches that make a room feel lived in.",
    image: "categories/vases-decor",
  },
  {
    slug: "candles-lighting",
    name: "Candles & Lighting",
    description: "Hand-poured candles and table lamps for a softer, warmer evening glow.",
    image: "categories/candles-lighting",
  },
  {
    slug: "cookware",
    name: "Cookware",
    description: "Cast iron and tri-ply steel built to be used every day and handed down.",
    image: "categories/cookware",
  },
  {
    slug: "kitchen-tools",
    name: "Kitchen Tools",
    description: "Wooden spoons, boards, knives and pantry storage that make cooking a pleasure.",
    image: "categories/kitchen-tools",
  },
  {
    slug: "tableware",
    name: "Tableware",
    description: "Stoneware plates, mugs and serveware for long breakfasts and slow dinners.",
    image: "categories/tableware",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

const CARE_WOOD =
  "Wipe with a soft, slightly damp cloth and dry straight away. Keep away from direct heat. Refresh with food-safe oil or wax every few months.";
const CARE_CERAMIC =
  "Dishwasher and microwave safe unless stated. Avoid sudden temperature changes. Hand-wash to keep glazes at their best.";
const CARE_CANDLE =
  "Trim the wick to 5 mm before each burn and burn for 2–3 hours at a time. Never leave a burning candle unattended.";
const CARE_IRON =
  "Hand-wash with hot water, dry thoroughly over low heat and rub in a thin layer of oil. Never soak or put in the dishwasher.";
const CARE_STEEL =
  "Dishwasher safe. For stubborn marks use a paste of baking soda and water. Suitable for all hobs including induction.";

const WOOD_FINISH: SeedOption = {
  name: "Finish",
  values: [
    { value: "Natural Oak", swatchHex: "#C8A27A" },
    { value: "Walnut", swatchHex: "#6B4A33", surchargeCents: 4000 },
  ],
};
const GLAZE: SeedOption = {
  name: "Color",
  values: [
    { value: "Chalk", swatchHex: "#EFEBE3" },
    { value: "Sage", swatchHex: "#9CAF88" },
    { value: "Sand", swatchHex: "#D9C7A7" },
  ],
};

export const PRODUCTS: SeedProduct[] = [
  // ── Side & accent tables ──────────────────────────────────────────────────
  {
    slug: "arlo-live-edge-coffee-table",
    title: "Arlo Live-Edge Coffee Table",
    category: "side-tables",
    priceCents: 64900,
    summary: "A single slab of solid wood with its natural edge left intact.",
    description:
      "Every Arlo table is cut from one slab, so the grain, knots and live edge are unique to yours. Finished with a hard-wax oil that deepens beautifully with age.",
    dimensions: "W 110 × D 60 × H 42 cm",
    materials: "Solid acacia slab, powder-coated steel base, hard-wax oil",
    care: CARE_WOOD,
    tags: ["table", "bestseller"],
    featured: true,
    ageDays: 48,
    salesCount: 142,
    images: ["products/live-edge-table", "site/coffee-table"],
  },
  {
    slug: "tove-stool-side-table",
    title: "Tove Stool Side Table",
    category: "side-tables",
    priceCents: 18900,
    summary: "A rustic three-leg stool that doubles as a bedside or plant table.",
    description:
      "Tove is carved from reclaimed timber and left deliberately simple. Use it beside the bed, next to the sofa or as an extra seat when friends come over.",
    dimensions: "Ø 38 × H 48 cm",
    materials: "Reclaimed hardwood, natural oil finish",
    care: CARE_WOOD,
    tags: ["table", "new"],
    featured: true,
    ageDays: 5,
    salesCount: 64,
    images: ["products/stool-side-table", "site/calm-room"],
    options: [WOOD_FINISH],
    stock: { Walnut: 3 },
  },
  {
    slug: "mara-marble-side-table",
    title: "Mara Marble Side Table",
    category: "side-tables",
    priceCents: 32900,
    compareAtCents: 38900,
    summary: "A round marble top on a slim pedestal — small, solid and elegant.",
    description:
      "Mara's honed marble top is cool to the touch and sized for a lamp, a book and a cup of tea. Each slab has its own veining.",
    dimensions: "Ø 45 × H 55 cm",
    materials: "Honed Carrara marble top, brushed steel pedestal",
    care: "Wipe spills immediately — marble is porous. Use coasters for acidic drinks. Reseal yearly.",
    tags: ["table", "sale"],
    ageDays: 90,
    salesCount: 81,
    images: ["products/marble-side-table", "products/linen-lamp"],
  },
  {
    slug: "elm-nesting-coffee-tables",
    title: "Elm Nesting Coffee Tables",
    category: "side-tables",
    priceCents: 49900,
    summary: "A pair of round tables that tuck together or spread out when you need space.",
    description:
      "Elm's two tables nest neatly to save space and pull apart for entertaining. The lower table glides under the upper one on slim, splayed legs.",
    dimensions: "Large Ø 80 × H 40 cm · Small Ø 60 × H 35 cm",
    materials: "Oak veneer tops, solid oak legs",
    care: CARE_WOOD,
    tags: ["table"],
    featured: true,
    ageDays: 30,
    salesCount: 97,
    images: ["products/nesting-tables", "site/living-warm"],
    options: [WOOD_FINISH],
  },
  {
    slug: "iris-glass-coffee-table",
    title: "Iris Glass Coffee Table",
    category: "side-tables",
    priceCents: 42900,
    summary: "A tinted glass top on a fine brass frame that keeps small rooms feeling open.",
    description:
      "Iris almost disappears in a room — the smoked glass top floats on a slender brass-finished frame, letting your rug and floor do the talking.",
    dimensions: "Ø 90 × H 40 cm",
    materials: "8 mm tempered tinted glass, brass-finished steel",
    care: "Clean with a glass cleaner and microfibre cloth.",
    tags: ["table"],
    ageDays: 120,
    salesCount: 40,
    images: ["products/glass-coffee-table", "site/living-bright"],
  },
  {
    slug: "cleo-console-shelf",
    title: "Cleo Two-Tier Console Shelf",
    category: "side-tables",
    priceCents: 27900,
    summary: "A light, two-tier console for hallways, entryways and narrow walls.",
    description:
      "Cleo gives you a landing spot for keys, plants and post without crowding the room. Two shelves, rounded edges and a quietly modern profile.",
    dimensions: "W 80 × D 30 × H 85 cm",
    materials: "Lacquered MDF shelves, solid ash frame",
    care: CARE_WOOD,
    tags: ["storage"],
    ageDays: 160,
    salesCount: 55,
    images: ["products/console-shelf", "site/calm-room"],
  },

  // ── Vases & decor ─────────────────────────────────────────────────────────
  {
    slug: "halo-ceramic-vase-trio",
    title: "Halo Ceramic Vase Trio",
    category: "vases-decor",
    priceCents: 8900,
    summary: "Three matte vases in complementary shapes — group them or spread them around.",
    description:
      "Slip-cast and finished with a soft matte glaze, the Halo trio is designed to be styled together on a shelf, mantel or dining table — with or without stems.",
    dimensions: "H 24 cm · 18 cm · 11 cm",
    materials: "Stoneware, matte glaze, watertight interior",
    care: CARE_CERAMIC,
    tags: ["vase", "bestseller"],
    featured: true,
    ageDays: 60,
    salesCount: 214,
    images: ["products/vase-trio", "site/living-bright"],
    options: [GLAZE],
  },
  {
    slug: "ripple-fluted-vase",
    title: "Ripple Fluted Vase",
    category: "vases-decor",
    priceCents: 5900,
    summary: "A tall fluted vase that catches the light along every ridge.",
    description:
      "Ripple's deep vertical fluting makes even a single stem look considered. Heavy enough to hold big hydrangeas without tipping.",
    dimensions: "Ø 14 × H 28 cm",
    materials: "Glazed porcelain",
    care: CARE_CERAMIC,
    tags: ["vase", "new"],
    ageDays: 8,
    salesCount: 73,
    images: ["products/fluted-vase", "products/vase-trio"],
  },
  {
    slug: "pebble-bud-vase",
    title: "Pebble Bud Vase",
    category: "vases-decor",
    priceCents: 3400,
    summary: "A small, round bud vase for a single flower or a sprig of eucalyptus.",
    description:
      "Pebble is the little vase you end up moving from room to room — bedside, bathroom shelf, desk. Hand-finished, so each one is slightly different.",
    dimensions: "Ø 11 × H 13 cm",
    materials: "Stoneware, satin glaze",
    care: CARE_CERAMIC,
    tags: ["vase"],
    ageDays: 75,
    salesCount: 160,
    images: ["products/bud-vase", "products/fluted-vase"],
    options: [GLAZE],
    stock: { Sand: 0 },
  },
  {
    slug: "coast-hand-painted-vases",
    title: "Coast Hand-Painted Vases",
    category: "vases-decor",
    priceCents: 7900,
    summary: "Brushstroke glazes in sea blues and greys, painted by hand.",
    description:
      "Each Coast vase is painted freehand in our partner studio, so no two are identical. Sold as a pair of complementary sizes.",
    dimensions: "H 26 cm and H 18 cm",
    materials: "Stoneware, hand-applied reactive glaze",
    care: CARE_CERAMIC,
    tags: ["vase", "handmade"],
    ageDays: 35,
    salesCount: 49,
    images: ["products/painted-vases", "site/crockery"],
  },
  {
    slug: "sea-grass-storage-baskets",
    title: "Seagrass Storage Baskets",
    category: "vases-decor",
    priceCents: 6900,
    summary: "Hand-woven baskets for throws, toys, towels or pantry overflow.",
    description:
      "Woven by hand from natural seagrass with a cotton liner and sturdy handles. Sturdy enough for the living room, soft enough for the nursery.",
    dimensions: "Set of 2 · W 36 × D 26 × H 24 cm",
    materials: "Seagrass, cotton liner",
    care: "Vacuum or brush to remove dust. Spot-clean the liner.",
    tags: ["storage"],
    featured: true,
    ageDays: 20,
    salesCount: 120,
    images: ["products/baskets", "products/baskets-2"],
    options: [
      { name: "Size", values: [{ value: "Medium" }, { value: "Large", surchargeCents: 2000 }] },
    ],
  },

  // ── Candles & lighting ────────────────────────────────────────────────────
  {
    slug: "fern-amber-glass-candle",
    title: "Fern Glass Jar Candle",
    category: "candles-lighting",
    priceCents: 3800,
    summary: "Vetiver, cedar and fig in a reusable tinted glass jar.",
    description:
      "Hand-poured with a coconut-soy wax blend and a cotton wick for a clean, even burn. Once it's finished, the jar makes a lovely tumbler or pen pot.",
    dimensions: "Ø 8 × H 10 cm · 220 g · approx. 45 h burn",
    materials: "Coconut-soy wax, cotton wick, recycled glass",
    care: CARE_CANDLE,
    tags: ["candle", "bestseller"],
    featured: true,
    ageDays: 40,
    salesCount: 305,
    images: ["products/amber-candle", "products/soy-candle"],
    options: [
      {
        name: "Scent",
        values: [{ value: "Vetiver & Fig" }, { value: "Cedar & Smoke" }, { value: "Fresh Linen" }],
      },
    ],
  },
  {
    slug: "glaze-ceramic-candle",
    title: "Glaze Ceramic Candle",
    category: "candles-lighting",
    priceCents: 4600,
    summary: "A candle poured into a drippy, hand-glazed ceramic vessel.",
    description:
      "When the candle is done, the vessel lives on as a planter or trinket dish. Scented with amber, sea salt and a little sage.",
    dimensions: "Ø 9 × H 9 cm · approx. 40 h burn",
    materials: "Soy wax, cotton wick, stoneware vessel",
    care: CARE_CANDLE,
    tags: ["candle", "new"],
    ageDays: 6,
    salesCount: 58,
    images: ["products/pillar-candle", "products/amber-candle"],
  },
  {
    slug: "hearth-soy-candle",
    title: "Hearth Soy Candle",
    category: "candles-lighting",
    priceCents: 2900,
    compareAtCents: 3600,
    summary: "Vanilla, tonka and woodsmoke for long winter evenings.",
    description:
      "A cosy, slow-burning candle in a clear glass jar with a lid to keep the scent fresh.",
    dimensions: "Ø 8 × H 9 cm · 200 g · approx. 40 h burn",
    materials: "Soy wax, cotton wick, glass jar, bamboo lid",
    care: CARE_CANDLE,
    tags: ["candle", "sale"],
    ageDays: 100,
    salesCount: 190,
    images: ["products/soy-candle", "products/pillar-candle"],
  },
  {
    slug: "dome-mushroom-table-lamp",
    title: "Dome Mushroom Table Lamp",
    category: "candles-lighting",
    priceCents: 15900,
    summary: "A softly glowing dome lamp that turns any corner into a reading nook.",
    description:
      "The opal dome diffuses light evenly with no glare, and the touch dimmer has three warm settings. Perfect on a side table or sideboard.",
    dimensions: "Ø 30 × H 38 cm · E27 LED bulb included",
    materials: "Opal glass shade, brushed metal stem",
    care: "Dust with a dry cloth. Switch off and let cool before cleaning.",
    tags: ["lighting", "bestseller"],
    featured: true,
    ageDays: 55,
    salesCount: 133,
    images: ["products/dome-lamp", "site/living-warm"],
    options: [
      {
        name: "Finish",
        values: [
          { value: "Brass", swatchHex: "#B89A5E" },
          { value: "Black", swatchHex: "#2E2C29" },
        ],
      },
    ],
  },
  {
    slug: "orb-globe-lamp",
    title: "Orb Globe Lamp",
    category: "candles-lighting",
    priceCents: 11900,
    summary: "A simple glass globe on a low base — like a small moon on your shelf.",
    description:
      "Orb throws a gentle ambient glow. Lovely in a bedroom, hallway or as a night light.",
    dimensions: "Ø 20 × H 24 cm",
    materials: "Hand-blown opal glass, ceramic base",
    care: "Dust with a dry cloth.",
    tags: ["lighting"],
    ageDays: 140,
    salesCount: 47,
    images: ["products/globe-lamp", "products/linen-lamp"],
  },
  {
    slug: "classic-linen-table-lamp",
    title: "Classic Linen Table Lamp",
    category: "candles-lighting",
    priceCents: 13900,
    summary: "A timeless lamp with a pleated base and natural linen shade.",
    description:
      "A classic shape that suits a bedside or a console, with a warm, flattering light.",
    dimensions: "Shade Ø 30 cm · H 52 cm",
    materials: "Ceramic base, linen shade",
    care: "Dust the shade with a soft brush.",
    tags: ["lighting"],
    ageDays: 70,
    salesCount: 66,
    images: ["products/linen-lamp", "products/marble-side-table"],
  },

  // ── Cookware ──────────────────────────────────────────────────────────────
  {
    slug: "forge-cast-iron-skillet",
    title: "Forge Cast Iron Skillet",
    category: "cookware",
    priceCents: 7900,
    summary: "Pre-seasoned cast iron that sears, bakes and gets better every year.",
    description:
      "Forge holds heat like nothing else — perfect for steaks, cornbread and crispy potatoes. Pre-seasoned with flaxseed oil and ready to use.",
    dimensions: "Available in 20 cm and 26 cm",
    materials: "Cast iron, flaxseed seasoning",
    care: CARE_IRON,
    tags: ["cookware", "bestseller"],
    featured: true,
    ageDays: 85,
    salesCount: 260,
    images: ["products/cast-iron-skillet", "products/cast-iron-skillet-2"],
    options: [
      { name: "Size", values: [{ value: "20 cm" }, { value: "26 cm", surchargeCents: 2000 }] },
    ],
  },
  {
    slug: "harbour-enamel-oval-roaster",
    title: "Harbour Enamel Oval Roaster",
    category: "cookware",
    priceCents: 11900,
    summary: "An enamelled cast iron roaster for Sunday chickens and slow braises.",
    description:
      "Harbour goes from hob to oven to table. The smooth enamel interior needs no seasoning and releases food easily.",
    dimensions: "L 34 × W 24 × H 9 cm · 4.2 L",
    materials: "Enamelled cast iron",
    care: "Hand-wash recommended. Avoid metal scourers on the enamel.",
    tags: ["cookware"],
    ageDays: 65,
    salesCount: 72,
    images: ["products/oval-roaster", "products/cast-iron-skillet"],
  },
  {
    slug: "tri-ply-stockpot",
    title: "Tri-Ply Stockpot",
    category: "cookware",
    priceCents: 9900,
    summary: "A heavy-based stainless stockpot for stocks, pasta and big batches.",
    description:
      "Tri-ply construction spreads heat evenly up the sides, so nothing scorches at the bottom.",
    dimensions: "Ø 24 cm · 7 L",
    materials: "18/10 stainless steel with aluminium core",
    care: CARE_STEEL,
    tags: ["cookware"],
    ageDays: 110,
    salesCount: 58,
    images: ["products/stockpot", "products/pan-set"],
  },
  {
    slug: "everyday-saucepan-set",
    title: "Everyday Saucepan Set",
    category: "cookware",
    priceCents: 18900,
    compareAtCents: 22900,
    summary: "Three stainless saucepans with lids — the backbone of a working kitchen.",
    description: "16, 18 and 20 cm saucepans with stay-cool handles, pouring rims and glass lids.",
    dimensions: "16 / 18 / 20 cm",
    materials: "18/10 stainless steel, tempered glass lids",
    care: CARE_STEEL,
    tags: ["cookware", "sale"],
    featured: true,
    ageDays: 25,
    salesCount: 88,
    images: ["products/pan-set", "products/saucepan"],
  },
  {
    slug: "brook-stovetop-kettle",
    title: "Brook Stovetop Kettle",
    category: "cookware",
    priceCents: 6900,
    summary: "A polished stainless kettle with a gentle whistle.",
    description:
      "Works on gas, electric and induction. The wide base boils quickly and the handle stays cool.",
    dimensions: "2.5 L",
    materials: "Stainless steel, heat-resistant handle",
    care: CARE_STEEL,
    tags: ["cookware", "new"],
    ageDays: 9,
    salesCount: 31,
    images: ["products/kettle", "products/stockpot"],
  },

  // ── Kitchen tools ─────────────────────────────────────────────────────────
  {
    slug: "olive-wood-spoon-set",
    title: "Olive Wood Spoon Set",
    category: "kitchen-tools",
    priceCents: 3900,
    summary: "Four hand-carved olive wood utensils that won't scratch your pans.",
    description:
      "A spoon, spatula, slotted spoon and serving spoon, each carved from a single piece of olive wood with its own grain pattern.",
    dimensions: "Lengths 28–32 cm",
    materials: "Olive wood",
    care: CARE_WOOD,
    tags: ["utensils", "bestseller"],
    featured: true,
    ageDays: 50,
    salesCount: 340,
    images: ["products/spoon-set", "site/crockery"],
  },
  {
    slug: "walnut-cutting-board",
    title: "Walnut End-Grain Cutting Board",
    category: "kitchen-tools",
    priceCents: 8900,
    summary: "A thick end-grain board that's kind to knives and looks good on the counter.",
    description:
      "End-grain construction lets knife edges slip between the fibres, so the board self-heals and your knives stay sharp longer.",
    dimensions: "Medium 40 × 28 × 4 cm · Large 50 × 35 × 4 cm",
    materials: "Solid walnut, food-safe mineral oil",
    care: CARE_WOOD,
    tags: ["boards"],
    ageDays: 95,
    salesCount: 115,
    images: ["products/cutting-board", "products/serving-boards"],
    options: [
      { name: "Size", values: [{ value: "Medium" }, { value: "Large", surchargeCents: 3000 }] },
    ],
  },
  {
    slug: "baker-bread-knife",
    title: "Baker Bread Knife",
    category: "kitchen-tools",
    priceCents: 5400,
    summary: "A long serrated blade that glides through crusty sourdough.",
    description: "German stainless steel with a wavy edge and a balanced beech handle.",
    dimensions: "Blade 23 cm",
    materials: "X50CrMoV15 stainless steel, beech handle",
    care: "Hand-wash and dry immediately. Store in a block or on a magnetic strip.",
    tags: ["knives"],
    ageDays: 130,
    salesCount: 77,
    images: ["products/bread-knife", "products/cutting-board"],
  },
  {
    slug: "pantry-glass-jar-set",
    title: "Pantry Glass Jar Set",
    category: "kitchen-tools",
    priceCents: 5900,
    summary: "Six clip-top jars to bring calm to your pantry shelves.",
    description:
      "Airtight rubber seals keep grains, pulses and coffee fresh. Includes reusable chalk labels and a pen.",
    dimensions: "Set of 6 · 2 × 1 L, 2 × 0.75 L, 2 × 0.5 L",
    materials: "Borosilicate glass, stainless clips, natural rubber seals",
    care: "Dishwasher safe (remove seals first).",
    tags: ["storage", "bestseller"],
    featured: true,
    ageDays: 28,
    salesCount: 290,
    images: ["products/pantry-jars", "products/pantry-jars-2"],
  },
  {
    slug: "swing-top-storage-canisters",
    title: "Swing-Top Storage Canisters",
    category: "kitchen-tools",
    priceCents: 4400,
    summary: "Three stackable glass canisters with acacia lids.",
    description:
      "Stack them on the counter for flour, sugar and oats — the wooden lids double as small trays.",
    dimensions: "Set of 3 · 0.6 / 0.9 / 1.2 L",
    materials: "Glass, acacia wood lids, silicone seals",
    care: "Glass is dishwasher safe; hand-wash the lids.",
    tags: ["storage", "new"],
    ageDays: 7,
    salesCount: 39,
    images: ["products/storage-jars", "site/kitchen"],
  },
  {
    slug: "acacia-serving-board-set",
    title: "Acacia Serving Board Set",
    category: "kitchen-tools",
    priceCents: 6400,
    summary: "Three paddle boards for cheese, bread and grazing platters.",
    description:
      "Each board is cut from solid acacia with a hanging hole so they look good on the wall, too.",
    dimensions: "Small, medium and large paddles",
    materials: "Solid acacia",
    care: CARE_WOOD,
    tags: ["boards"],
    ageDays: 150,
    salesCount: 61,
    images: ["products/serving-boards", "site/crockery"],
  },

  // ── Tableware ─────────────────────────────────────────────────────────────
  {
    slug: "linden-stoneware-dinner-set",
    title: "Linden Stoneware Dinner Set",
    category: "tableware",
    priceCents: 14900,
    summary: "A 12-piece stoneware set — dinner plates, side plates and bowls for four.",
    description:
      "Linden's soft speckled glaze and gently raised rims feel handmade, but it's sturdy enough for everyday use and fully dishwasher safe.",
    dimensions: "Dinner Ø 27 cm · Side Ø 21 cm · Bowl Ø 16 cm",
    materials: "Reactive-glaze stoneware",
    care: CARE_CERAMIC,
    tags: ["dinnerware", "bestseller"],
    featured: true,
    ageDays: 45,
    salesCount: 175,
    images: ["products/dinner-set", "products/dinner-set-2"],
    options: [GLAZE],
  },
  {
    slug: "everyday-white-mugs",
    title: "Everyday White Mugs, Set of 2",
    category: "tableware",
    priceCents: 3200,
    summary: "Straight-sided porcelain mugs with a generous handle.",
    description: "The mug you'll reach for every morning: thin rim, sturdy base, 350 ml.",
    dimensions: "350 ml · H 10 cm",
    materials: "Porcelain",
    care: CARE_CERAMIC,
    tags: ["mugs"],
    ageDays: 80,
    salesCount: 230,
    images: ["products/white-mugs", "site/breakfast"],
  },
  {
    slug: "terracotta-latte-cup",
    title: "Terracotta Latte Cup",
    category: "tableware",
    priceCents: 2400,
    summary: "A wide, warm-toned cup made for foamy coffees.",
    description: "Partially glazed so you can feel the raw clay on the outside. 300 ml.",
    dimensions: "300 ml · Ø 10 cm",
    materials: "Terracotta stoneware",
    care: CARE_CERAMIC,
    tags: ["mugs", "new"],
    ageDays: 4,
    salesCount: 44,
    images: ["products/terracotta-cup", "products/ocean-cup"],
  },
  {
    slug: "ocean-glaze-cup",
    title: "Ocean Glaze Cup",
    category: "tableware",
    priceCents: 2600,
    summary: "A deep teal reactive glaze that pools and shifts in the kiln.",
    description: "Every Ocean cup comes out of the kiln a little different. 280 ml.",
    dimensions: "280 ml",
    materials: "Stoneware, reactive glaze",
    care: CARE_CERAMIC,
    tags: ["mugs"],
    ageDays: 60,
    salesCount: 98,
    images: ["products/ocean-cup", "products/terracotta-cup"],
  },
  {
    slug: "pastel-rim-side-plates",
    title: "Pastel Rim Side Plates",
    category: "tableware",
    priceCents: 4800,
    summary: "Six side plates with softly coloured rims for a playful table.",
    description: "Mix and match pastel rims for brunch, cake or tapas. Set of 6.",
    dimensions: "Ø 21 cm · set of 6",
    materials: "Porcelain",
    care: CARE_CERAMIC,
    tags: ["dinnerware"],
    ageDays: 115,
    salesCount: 52,
    images: ["products/side-plates", "products/dinner-set-2"],
  },
  {
    slug: "garden-blue-tea-set",
    title: "Garden Blue Tea Set",
    category: "tableware",
    priceCents: 8900,
    summary: "A hand-decorated teapot with four cups and saucers.",
    description: "Painted with a blue garden motif — a joy for afternoon tea or as a gift.",
    dimensions: "Teapot 1 L · cups 200 ml",
    materials: "Porcelain, hand-applied decoration",
    care: "Hand-wash recommended to protect the decoration.",
    tags: ["tea", "handmade"],
    ageDays: 38,
    salesCount: 46,
    images: ["products/tea-set", "products/white-mugs"],
  },
  {
    slug: "morning-wooden-breakfast-tray",
    title: "Morning Wooden Breakfast Tray",
    category: "tableware",
    priceCents: 4200,
    summary: "A raised-edge tray for breakfast in bed or carrying the coffee round.",
    description: "Solid wood with cut-out handles and a lacquered surface that wipes clean.",
    dimensions: "W 48 × D 32 × H 5 cm",
    materials: "Solid acacia, food-safe lacquer",
    care: CARE_WOOD,
    tags: ["serveware"],
    ageDays: 22,
    salesCount: 68,
    images: ["products/breakfast-tray", "site/breakfast"],
  },
];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const imageUrl = (name: string) => `/images/${name}.webp`;

export const REVIEW_SNIPPETS: { rating: number; title: string; body: string; name: string }[] = [
  {
    rating: 5,
    title: "Even better in person",
    body: "The finish is gorgeous and it looks exactly like the photos. Beautifully packed and it arrived two days early.",
    name: "Amelia R.",
  },
  {
    rating: 5,
    title: "Used every single day",
    body: "Three months in and it still looks brand new. You can feel the quality the moment you pick it up.",
    name: "Daniel K.",
  },
  {
    rating: 4,
    title: "Lovely quality",
    body: "Really well made and a great size. Delivery took a little longer than expected, but worth the wait.",
    name: "Priya S.",
  },
  {
    rating: 5,
    title: "My favourite purchase this year",
    body: "It has completely changed the feel of my kitchen. I've already ordered a second one as a gift.",
    name: "Marcus L.",
  },
  {
    rating: 4,
    title: "Calm and beautiful",
    body: "Exactly the understated look I wanted. Simple, sturdy and it photographs beautifully too.",
    name: "Hannah W.",
  },
  {
    rating: 3,
    title: "Nice, slightly smaller than expected",
    body: "Looks great and feels solid. A little smaller than I pictured, so do check the dimensions.",
    name: "Oliver T.",
  },
];

export const PENDING_REVIEWS: { rating: number; title: string; body: string; name: string }[] = [
  {
    rating: 5,
    title: "Absolutely love it",
    body: "Arrived yesterday and it already feels like it has always been part of our home.",
    name: "Sofia M.",
  },
  {
    rating: 2,
    title: "Colour slightly different",
    body: "Good quality but the glaze is a touch darker than on my screen. Customer service was very helpful though.",
    name: "Ben A.",
  },
];
