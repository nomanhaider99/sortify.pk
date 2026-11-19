/**
 * Photos used by the storefront, all from Pexels (https://www.pexels.com/license/ — free for
 * commercial use, no attribution required; we credit them anyway in docs/image-credits.md).
 * `scripts/fetch-images.ts` downloads each one ONCE into `storefront/public/images/` as WebP, so
 * the site never hotlinks Pexels.
 */
export type ManifestImage = {
  /** Output path under storefront/public/images (without extension). */
  name: string;
  pexelsId: number;
  /** Max output width in px. */
  width: number;
  alt: string;
};

export const SITE_IMAGES: ManifestImage[] = [
  {
    name: "site/hero",
    pexelsId: 15558114,
    width: 2400,
    alt: "A warm living room with a lit fireplace, bookshelves and a wooden coffee table",
  },
  {
    name: "site/kitchen-shelves",
    pexelsId: 3505699,
    width: 2000,
    alt: "Ceramic bowls, plates and a carafe on rustic wooden kitchen shelves",
  },
  {
    name: "site/living-warm",
    pexelsId: 7851906,
    width: 2000,
    alt: "A cosy living room with a linen sofa, rug and warm lamp light",
  },
  {
    name: "site/kitchen",
    pexelsId: 6654122,
    width: 1800,
    alt: "Open kitchen shelves lined with glass storage jars and ceramics",
  },
  {
    name: "site/dining",
    pexelsId: 9707347,
    width: 2000,
    alt: "A wooden dining table set with plates, glasses and potted plants",
  },
  {
    name: "site/table-setting",
    pexelsId: 1114425,
    width: 2000,
    alt: "A long candlelit table set with glassware and plates",
  },
  {
    name: "site/living-bright",
    pexelsId: 28991200,
    width: 1800,
    alt: "A bright living room with a cream armchair, side table and plants",
  },
  {
    name: "site/calm-room",
    pexelsId: 12285892,
    width: 1600,
    alt: "A minimal white room with a sofa and a plant in a woven basket",
  },
  {
    name: "site/workshop",
    pexelsId: 6611312,
    width: 2000,
    alt: "A potter shaping a vase on a wheel in a bright studio",
  },
  {
    name: "site/hands-clay",
    pexelsId: 18486386,
    width: 1600,
    alt: "Hands forming a clay bowl on a spinning pottery wheel",
  },
  {
    name: "site/clay-pot",
    pexelsId: 4898084,
    width: 1600,
    alt: "An artisan's hands smoothing a clay pot",
  },
  {
    name: "site/crockery",
    pexelsId: 6213678,
    width: 1600,
    alt: "Handmade crockery and wooden boards on a kitchen counter",
  },
  {
    name: "site/breakfast",
    pexelsId: 33864616,
    width: 1600,
    alt: "A breakfast tray with coffee and a fruit bowl",
  },
  {
    name: "site/coffee-table",
    pexelsId: 1907071,
    width: 1600,
    alt: "Two cups of coffee on a live-edge wooden table",
  },
];

export const CATEGORY_IMAGES: ManifestImage[] = [
  {
    name: "categories/side-tables",
    pexelsId: 8251682,
    width: 1600,
    alt: "A rustic wooden side table beside a bed",
  },
  {
    name: "categories/vases-decor",
    pexelsId: 14608172,
    width: 1600,
    alt: "Three white ceramic vases",
  },
  {
    name: "categories/candles-lighting",
    pexelsId: 34237532,
    width: 1600,
    alt: "A glowing mushroom table lamp",
  },
  {
    name: "categories/cookware",
    pexelsId: 5782042,
    width: 1600,
    alt: "Stainless steel pots and pans",
  },
  {
    name: "categories/kitchen-tools",
    pexelsId: 8922337,
    width: 1600,
    alt: "Wooden spoons and vintage silverware",
  },
  {
    name: "categories/tableware",
    pexelsId: 8251778,
    width: 1600,
    alt: "Stacked white plates and a wooden bowl",
  },
];

/** Product photos, keyed by the name referenced from the seed catalog. */
export const PRODUCT_IMAGES: ManifestImage[] = [
  // Side & accent tables
  {
    name: "products/live-edge-table",
    pexelsId: 1907071,
    width: 1400,
    alt: "Live-edge wooden table with two cups of coffee",
  },
  {
    name: "products/stool-side-table",
    pexelsId: 8251682,
    width: 1400,
    alt: "Rustic wooden stool used as a bedside table",
  },
  {
    name: "products/marble-side-table",
    pexelsId: 545048,
    width: 1400,
    alt: "Round marble side table with a vase and lamp",
  },
  {
    name: "products/nesting-tables",
    pexelsId: 20285350,
    width: 1400,
    alt: "Round wooden nesting coffee tables in a living room",
  },
  {
    name: "products/glass-coffee-table",
    pexelsId: 1669799,
    width: 1400,
    alt: "Round glass coffee table in a grey living room",
  },
  {
    name: "products/console-shelf",
    pexelsId: 12277219,
    width: 1400,
    alt: "White two-tier console shelf with a plant and clock",
  },
  // Vases & decor
  {
    name: "products/vase-trio",
    pexelsId: 14608172,
    width: 1400,
    alt: "Trio of matte white ceramic vases",
  },
  {
    name: "products/fluted-vase",
    pexelsId: 10013403,
    width: 1400,
    alt: "White fluted vase with blue hydrangeas",
  },
  {
    name: "products/bud-vase",
    pexelsId: 7034591,
    width: 1400,
    alt: "Round white bud vase and candle on a stack of books",
  },
  {
    name: "products/painted-vases",
    pexelsId: 7674564,
    width: 1400,
    alt: "Hand-painted blue and white ceramic vases and cups",
  },
  {
    name: "products/baskets",
    pexelsId: 8581052,
    width: 1400,
    alt: "Two woven storage baskets on a white shelf",
  },
  {
    name: "products/baskets-2",
    pexelsId: 8286098,
    width: 1400,
    alt: "Woven baskets on the floor beside a wooden chair",
  },
  // Candles & lighting
  {
    name: "products/amber-candle",
    pexelsId: 6311846,
    width: 1400,
    alt: "Lit candle in a green glass jar",
  },
  {
    name: "products/pillar-candle",
    pexelsId: 19599184,
    width: 1400,
    alt: "Lit candle in a glazed ceramic holder",
  },
  {
    name: "products/soy-candle",
    pexelsId: 7704461,
    width: 1400,
    alt: "Homemade soy candle in a glass jar on a brass tray",
  },
  {
    name: "products/dome-lamp",
    pexelsId: 34237532,
    width: 1400,
    alt: "Mushroom dome table lamp glowing warmly",
  },
  {
    name: "products/globe-lamp",
    pexelsId: 6825324,
    width: 1400,
    alt: "White glass globe lamp against a neutral wall",
  },
  {
    name: "products/linen-lamp",
    pexelsId: 1176516,
    width: 1400,
    alt: "Table lamp with a white linen shade on a nightstand",
  },
  // Cookware
  {
    name: "products/cast-iron-skillet",
    pexelsId: 5593702,
    width: 1400,
    alt: "Cast iron skillet toasting bread on a stove",
  },
  {
    name: "products/cast-iron-skillet-2",
    pexelsId: 5639274,
    width: 1400,
    alt: "Cast iron skillet with a baked casserole",
  },
  {
    name: "products/oval-roaster",
    pexelsId: 1435909,
    width: 1400,
    alt: "Dark enamel oval roaster on a wooden table with vegetables",
  },
  {
    name: "products/stockpot",
    pexelsId: 28726706,
    width: 1400,
    alt: "Stacked stainless steel stockpots",
  },
  {
    name: "products/pan-set",
    pexelsId: 5782042,
    width: 1400,
    alt: "Stainless steel saucepans and pots",
  },
  {
    name: "products/saucepan",
    pexelsId: 6213723,
    width: 1400,
    alt: "Cooking with stainless steel saucepans on a stove",
  },
  {
    name: "products/kettle",
    pexelsId: 13772359,
    width: 1400,
    alt: "Stainless steel kettle on a gas stove",
  },
  // Kitchen tools
  {
    name: "products/spoon-set",
    pexelsId: 8922337,
    width: 1400,
    alt: "Olive wood spoons and silverware on linen",
  },
  {
    name: "products/cutting-board",
    pexelsId: 32878603,
    width: 1400,
    alt: "Handcrafted knife on a rustic wooden cutting board",
  },
  {
    name: "products/bread-knife",
    pexelsId: 7604435,
    width: 1400,
    alt: "Bread knife beside a sliced loaf on a chopping board",
  },
  {
    name: "products/pantry-jars",
    pexelsId: 3737639,
    width: 1400,
    alt: "Glass clip-top jars filled with grains and pulses",
  },
  {
    name: "products/pantry-jars-2",
    pexelsId: 4440173,
    width: 1400,
    alt: "Glass jars neatly arranged on white pantry shelves",
  },
  {
    name: "products/storage-jars",
    pexelsId: 3847450,
    width: 1400,
    alt: "Glass storage canisters on a kitchen counter",
  },
  {
    name: "products/serving-boards",
    pexelsId: 6213678,
    width: 1400,
    alt: "Wooden serving boards and ceramics on a counter",
  },
  // Tableware
  {
    name: "products/dinner-set",
    pexelsId: 8251778,
    width: 1400,
    alt: "Stoneware plates and a wooden bowl on a sideboard",
  },
  {
    name: "products/dinner-set-2",
    pexelsId: 8251873,
    width: 1400,
    alt: "Top view of white stoneware plates and a wooden bowl",
  },
  {
    name: "products/white-mugs",
    pexelsId: 593332,
    width: 1400,
    alt: "Two white ceramic mugs on a wooden table",
  },
  {
    name: "products/terracotta-cup",
    pexelsId: 27874915,
    width: 1400,
    alt: "Cappuccino in a terracotta ceramic cup",
  },
  {
    name: "products/ocean-cup",
    pexelsId: 2478341,
    width: 1400,
    alt: "Teal glazed ceramic cup on a wooden table",
  },
  {
    name: "products/side-plates",
    pexelsId: 95218,
    width: 1400,
    alt: "Stack of pastel-rimmed side plates",
  },
  {
    name: "products/tea-set",
    pexelsId: 18273392,
    width: 1400,
    alt: "Blue floral ceramic tea set on a wooden table",
  },
  {
    name: "products/breakfast-tray",
    pexelsId: 33864616,
    width: 1400,
    alt: "Wooden breakfast tray with coffee and a fruit bowl",
  },
];

export const ALL_IMAGES = [...SITE_IMAGES, ...CATEGORY_IMAGES, ...PRODUCT_IMAGES];
