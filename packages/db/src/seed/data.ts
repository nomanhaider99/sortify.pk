/**
 * Seed catalog. Also consumed by `scripts/generate-placeholders.ts`, which renders a neutral
 * placeholder image for every product/colour combination into `storefront/public/seed/`.
 */

export type FurnitureKind =
  | "armchair"
  | "swivel"
  | "wingback"
  | "dining-chair"
  | "stool"
  | "sofa"
  | "loveseat"
  | "coffee-table"
  | "dining-table"
  | "round-table"
  | "console"
  | "sideboard"
  | "nightstand"
  | "dresser"
  | "wardrobe"
  | "bed"
  | "bench"
  | "lamp";

export type SeedColor = { name: string; hex: string };

export type SeedProduct = {
  slug: string;
  title: string;
  category: CategorySlug;
  kind: FurnitureKind;
  priceCents: number;
  compareAtCents?: number;
  summary: string;
  description: string;
  dimensions: string;
  materials: string;
  care: string;
  tags: string[];
  featured?: boolean;
  /** Days ago the product was published (drives "newest" sort). */
  ageDays: number;
  salesCount: number;
  colors?: SeedColor[];
  /** Materials offered as an option; surcharge in cents relative to the base price. */
  materialOptions?: { name: string; surchargeCents: number }[];
  /** Explicit stock overrides keyed by "Color/Material" (or "Color", "Material", "default"). */
  stock?: Record<string, number>;
  /** Single tone used for products without a colour option. */
  tone?: string;
};

export const CATEGORIES = [
  {
    slug: "chairs",
    name: "Chairs",
    description: "Lounge, accent and swivel chairs shaped for long, unhurried sitting.",
    kind: "armchair",
    tone: "#B9A58A",
  },
  {
    slug: "living-room",
    name: "Living Room",
    description: "Sofas, tables and lighting for the room everyone gathers in.",
    kind: "sofa",
    tone: "#C9BFAE",
  },
  {
    slug: "bedroom",
    name: "Bedroom",
    description: "Beds, nightstands and storage made for calm, restful spaces.",
    kind: "bed",
    tone: "#A9B59A",
  },
  {
    slug: "dining-room",
    name: "Dining Room",
    description: "Tables, chairs and sideboards for long dinners and slow breakfasts.",
    kind: "dining-table",
    tone: "#8F6E52",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  name: string;
  description: string;
  kind: FurnitureKind;
  tone: string;
}>;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

const OAT = { name: "Oat", hex: "#E6DCCB" };
const SAGE = { name: "Sage", hex: "#9CAF88" };
const MOSS = { name: "Moss", hex: "#5F6B3A" };
const CHARCOAL = { name: "Charcoal", hex: "#4A4A48" };
const CLAY = { name: "Clay", hex: "#B8775A" };
const IVORY = { name: "Ivory", hex: "#F1ECE2" };
const SAND = { name: "Sand", hex: "#D2BFA0" };
const OAK = { name: "Natural Oak", hex: "#C8A27A" };
const WALNUT = { name: "Walnut", hex: "#6B4A33" };
const BLACK_ASH = { name: "Black Ash", hex: "#2E2C29" };

const FABRIC = [
  { name: "Bouclé", surchargeCents: 0 },
  { name: "Performance Linen", surchargeCents: 6000 },
];
const LEATHER = [
  { name: "Woven Fabric", surchargeCents: 0 },
  { name: "Aniline Leather", surchargeCents: 25000 },
];

const CARE_UPHOLSTERY =
  "Vacuum weekly with a soft brush attachment. Blot spills immediately with a clean, damp cloth. Rotate cushions monthly.";
const CARE_WOOD =
  "Dust with a soft dry cloth. Wipe spills promptly and avoid direct sunlight and heat sources. Re-oil once a year.";

export const PRODUCTS: SeedProduct[] = [
  // ── Chairs ────────────────────────────────────────────────────────────────
  {
    slug: "sora-lounge-chair",
    title: "Sora Lounge Chair",
    category: "chairs",
    kind: "armchair",
    priceCents: 89900,
    summary: "A low, generous lounge chair with a softly rounded back and solid oak legs.",
    description:
      "Sora is built for sinking into. A kiln-dried hardwood frame is wrapped in high-resilience foam and a feather-blend seat cushion, then finished with tapered solid oak legs.",
    dimensions: "W 82 × D 86 × H 74 cm · Seat height 40 cm",
    materials: "Kiln-dried hardwood frame, HR foam, feather-blend cushion, solid oak legs",
    care: CARE_UPHOLSTERY,
    tags: ["lounge", "bestseller"],
    featured: true,
    ageDays: 40,
    salesCount: 182,
    colors: [OAT, SAGE, CHARCOAL],
    materialOptions: FABRIC,
    stock: { "Charcoal/Performance Linen": 0, "Sage/Bouclé": 3 },
  },
  {
    slug: "mira-swivel-chair",
    title: "Mira Swivel Chair",
    category: "chairs",
    kind: "swivel",
    priceCents: 64900,
    summary: "A sculptural barrel chair on a brushed brass swivel base.",
    description:
      "Mira's enveloping barrel shape turns a full 360° on a weighted brushed-brass base. The bouclé upholstery is soft, durable and wonderfully tactile.",
    dimensions: "W 76 × D 74 × H 72 cm · Seat height 42 cm",
    materials: "Steel swivel mechanism, brushed brass base, bouclé upholstery",
    care: CARE_UPHOLSTERY,
    tags: ["swivel", "new"],
    featured: true,
    ageDays: 6,
    salesCount: 96,
    colors: [IVORY, MOSS, CLAY],
  },
  {
    slug: "otis-accent-chair",
    title: "Otis Accent Chair",
    category: "chairs",
    kind: "armchair",
    priceCents: 45900,
    summary: "A compact accent chair with an open wooden frame and loose cushions.",
    description:
      "Otis pairs a slim solid-wood frame with brass-capped feet and plump, removable cushions — a small-space chair that never feels like a compromise.",
    dimensions: "W 66 × D 74 × H 80 cm · Seat height 44 cm",
    materials: "Solid ash frame, brass caps, removable cotton-linen cushions",
    care: CARE_WOOD,
    tags: ["accent"],
    ageDays: 75,
    salesCount: 140,
    colors: [OAT, SAGE],
    stock: { Sage: 2 },
  },
  {
    slug: "halden-wingback-chair",
    title: "Halden Wingback Chair",
    category: "chairs",
    kind: "wingback",
    priceCents: 119900,
    compareAtCents: 139900,
    summary: "A modern wingback with a tall, supportive back and hand-tufted seat.",
    description:
      "Halden reworks the classic reading chair with cleaner lines and a slimmer profile. Offered in woven fabric or a supple aniline leather that patinas beautifully.",
    dimensions: "W 80 × D 84 × H 104 cm · Seat height 43 cm",
    materials: "Beech frame, pocket-spring seat, woven fabric or aniline leather",
    care: CARE_UPHOLSTERY,
    tags: ["reading", "sale"],
    ageDays: 120,
    salesCount: 64,
    colors: [SAND, CHARCOAL],
    materialOptions: LEATHER,
  },
  {
    slug: "juno-boucle-armchair",
    title: "Juno Bouclé Armchair",
    category: "chairs",
    kind: "swivel",
    priceCents: 69900,
    summary: "A plush tufted armchair that wraps you in soft bouclé.",
    description:
      "Juno's channel-tufted shell sits on a low plinth for a grounded, cocooning silhouette. Perfect beside a fireplace or in a quiet reading corner.",
    dimensions: "W 84 × D 80 × H 70 cm · Seat height 40 cm",
    materials: "Plywood shell, channel-tufted foam, bouclé upholstery, lacquered plinth",
    care: CARE_UPHOLSTERY,
    tags: ["tufted"],
    ageDays: 22,
    salesCount: 58,
    colors: [MOSS, IVORY],
  },
  {
    slug: "pell-rattan-chair",
    title: "Pell Rattan Chair",
    category: "chairs",
    kind: "dining-chair",
    priceCents: 32900,
    summary: "Hand-woven rattan on a light oak frame — airy, warm and easy to move.",
    description:
      "Each Pell chair is woven by hand, so no two are quite the same. Lightweight enough to move from desk to dining table to terrace.",
    dimensions: "W 52 × D 56 × H 82 cm · Seat height 46 cm",
    materials: "Solid oak frame, hand-woven natural rattan",
    care: CARE_WOOD,
    tags: ["rattan"],
    ageDays: 160,
    salesCount: 210,
    tone: "#C8A27A",
  },

  // ── Living Room ───────────────────────────────────────────────────────────
  {
    slug: "alba-three-seater-sofa",
    title: "Alba Three-Seater Sofa",
    category: "living-room",
    kind: "sofa",
    priceCents: 219900,
    summary: "A deep, low-slung three-seater with feather-wrapped cushions.",
    description:
      "Alba is the sofa you build a room around: deep seats, a relaxed lean-back angle and cushions that are generous without being shapeless.",
    dimensions: "W 228 × D 98 × H 76 cm · Seat depth 62 cm",
    materials: "FSC-certified hardwood frame, sinuous springs, feather-wrapped foam cushions",
    care: CARE_UPHOLSTERY,
    tags: ["sofa", "bestseller"],
    featured: true,
    ageDays: 55,
    salesCount: 120,
    colors: [OAT, SAGE, CHARCOAL],
    materialOptions: FABRIC,
  },
  {
    slug: "rowan-modular-sofa",
    title: "Rowan Modular Sofa",
    category: "living-room",
    kind: "sofa",
    priceCents: 289900,
    summary: "A modular sofa you can reconfigure as your space changes.",
    description:
      "Rowan's modules clip together securely and come apart in seconds. Start with three seats and add a chaise or corner whenever you like.",
    dimensions: "W 270 × D 102 × H 72 cm (3 modules)",
    materials: "Hardwood frame, webbed suspension, HR foam, removable covers",
    care: CARE_UPHOLSTERY,
    tags: ["modular", "new"],
    ageDays: 4,
    salesCount: 34,
    colors: [SAND, MOSS],
  },
  {
    slug: "cove-loveseat",
    title: "Cove Loveseat",
    category: "living-room",
    kind: "loveseat",
    priceCents: 129900,
    summary: "A rounded two-seater with a gently curved back and brass plinth.",
    description:
      "Cove's continuous curve softens any corner. The low brushed-brass plinth gives it a light, floating presence.",
    dimensions: "W 160 × D 88 × H 72 cm",
    materials: "Hardwood frame, curved foam back, bouclé upholstery, brass plinth",
    care: CARE_UPHOLSTERY,
    tags: ["loveseat"],
    featured: true,
    ageDays: 30,
    salesCount: 77,
    colors: [IVORY, CLAY],
  },
  {
    slug: "tamsin-coffee-table",
    title: "Tamsin Coffee Table",
    category: "living-room",
    kind: "coffee-table",
    priceCents: 74900,
    summary: "A solid wood coffee table with rounded corners and a lower shelf.",
    description:
      "Tamsin's thick, softly radiused top is joined to the base with traditional mortise and tenon joints. The lower shelf keeps books and throws close at hand.",
    dimensions: "W 120 × D 65 × H 38 cm",
    materials: "Solid oak or walnut, hard-wax oil finish",
    care: CARE_WOOD,
    tags: ["table"],
    ageDays: 90,
    salesCount: 88,
    colors: [OAK, WALNUT],
  },
  {
    slug: "elm-media-console",
    title: "Elm Media Console",
    category: "living-room",
    kind: "console",
    priceCents: 99900,
    summary: "A long, low console with fluted doors and cable management.",
    description:
      "Elm hides the clutter: fluted sliding doors, adjustable shelves and a discreet cable channel keep everything tidy while the top displays what matters.",
    dimensions: "W 180 × D 45 × H 52 cm",
    materials: "Oak veneer on FSC plywood, solid oak fluting",
    care: CARE_WOOD,
    tags: ["storage"],
    ageDays: 140,
    salesCount: 41,
    colors: [OAK, BLACK_ASH],
    stock: { "Black Ash": 0 },
  },
  {
    slug: "nori-floor-lamp",
    title: "Nori Floor Lamp",
    category: "living-room",
    kind: "lamp",
    priceCents: 27900,
    summary: "A paper-shade floor lamp that throws a warm, diffused glow.",
    description:
      "Nori's hand-folded paper shade sits on a slender oak stem. Dimmable, with a soft-touch foot switch.",
    dimensions: "Ø 45 × H 160 cm",
    materials: "Rice paper shade, solid oak stem, steel base",
    care: "Dust the shade gently with a soft brush. Use LED bulbs only (max 9W).",
    tags: ["lighting"],
    ageDays: 12,
    salesCount: 150,
    tone: "#E9DEC8",
  },

  // ── Bedroom ───────────────────────────────────────────────────────────────
  {
    slug: "hollis-platform-bed",
    title: "Hollis Platform Bed",
    category: "bedroom",
    kind: "bed",
    priceCents: 159900,
    summary: "A low platform bed in solid wood with a floating headboard.",
    description:
      "Hollis sits close to the floor for a calm, grounded bedroom. The slatted base needs no box spring and the headboard is angled for reading in bed.",
    dimensions: "Queen: W 168 × L 218 × H 90 cm",
    materials: "Solid oak or walnut, beech slats",
    care: CARE_WOOD,
    tags: ["bed", "bestseller"],
    featured: true,
    ageDays: 65,
    salesCount: 73,
    colors: [OAK, WALNUT],
  },
  {
    slug: "wren-upholstered-bed",
    title: "Wren Upholstered Bed",
    category: "bedroom",
    kind: "bed",
    priceCents: 179900,
    summary: "A softly upholstered bed with a tall channel-stitched headboard.",
    description:
      "Wren wraps the whole frame in fabric for a hotel-soft finish, with a tall channel-stitched headboard that's made for leaning back.",
    dimensions: "Queen: W 172 × L 222 × H 120 cm",
    materials: "Hardwood frame, padded upholstery, beech slats",
    care: CARE_UPHOLSTERY,
    tags: ["bed", "new"],
    ageDays: 3,
    salesCount: 19,
    colors: [SAGE, OAT, CHARCOAL],
    materialOptions: FABRIC,
  },
  {
    slug: "ines-nightstand",
    title: "Ines Nightstand",
    category: "bedroom",
    kind: "nightstand",
    priceCents: 34900,
    summary: "A two-drawer nightstand with soft-close runners.",
    description:
      "Ines keeps bedside essentials within reach: two soft-close drawers, a cable cut-out for charging and a top sized for a lamp, a book and a glass of water.",
    dimensions: "W 50 × D 40 × H 55 cm",
    materials: "Solid oak or walnut, soft-close metal runners",
    care: CARE_WOOD,
    tags: ["storage"],
    ageDays: 100,
    salesCount: 133,
    colors: [OAK, WALNUT],
    stock: { Walnut: 3 },
  },
  {
    slug: "brook-dresser",
    title: "Brook Dresser",
    category: "bedroom",
    kind: "dresser",
    priceCents: 129900,
    summary: "A six-drawer dresser with recessed pulls and dovetail joints.",
    description:
      "Brook is made the old-fashioned way — dovetailed drawers in solid wood that will glide smoothly for decades.",
    dimensions: "W 140 × D 48 × H 82 cm",
    materials: "Solid oak, dovetail joinery, hard-wax oil finish",
    care: CARE_WOOD,
    tags: ["storage"],
    ageDays: 180,
    salesCount: 39,
    tone: "#C8A27A",
  },
  {
    slug: "lune-bench",
    title: "Lune Bench",
    category: "bedroom",
    kind: "bench",
    priceCents: 42900,
    summary: "An upholstered end-of-bed bench on slim wooden legs.",
    description:
      "Lune is the finishing touch at the foot of the bed — somewhere to sit, lay out tomorrow's clothes or stack a few cushions.",
    dimensions: "W 130 × D 42 × H 46 cm",
    materials: "Oak legs, padded seat, bouclé or linen upholstery",
    care: CARE_UPHOLSTERY,
    tags: ["bench"],
    ageDays: 45,
    salesCount: 52,
    colors: [IVORY, SAGE],
  },
  {
    slug: "moss-wardrobe",
    title: "Moss Wardrobe",
    category: "bedroom",
    kind: "wardrobe",
    priceCents: 199900,
    summary: "A tall two-door wardrobe with internal drawers and hanging rail.",
    description:
      "Moss offers serious storage in a quiet form: full-height doors, a long hanging rail, two internal drawers and adjustable shelves.",
    dimensions: "W 110 × D 60 × H 200 cm",
    materials: "Oak veneer on FSC plywood, solid oak handles",
    care: CARE_WOOD,
    tags: ["storage"],
    ageDays: 210,
    salesCount: 17,
    tone: "#B79A78",
    stock: { default: 2 },
  },

  // ── Dining Room ───────────────────────────────────────────────────────────
  {
    slug: "calder-dining-table",
    title: "Calder Dining Table",
    category: "dining-room",
    kind: "dining-table",
    priceCents: 189900,
    summary: "A solid wood dining table that seats six, with a gently bevelled edge.",
    description:
      "Calder's thick top and splayed trestle legs give it presence without heaviness. Seats six comfortably, eight at a squeeze.",
    dimensions: "W 200 × D 95 × H 75 cm",
    materials: "Solid oak or walnut, hard-wax oil finish",
    care: CARE_WOOD,
    tags: ["table", "bestseller"],
    featured: true,
    ageDays: 85,
    salesCount: 66,
    colors: [OAK, WALNUT],
  },
  {
    slug: "isla-round-table",
    title: "Isla Round Table",
    category: "dining-room",
    kind: "round-table",
    priceCents: 129900,
    summary: "A round pedestal table for four — no legs to bump into.",
    description:
      "Isla's sculpted pedestal base leaves plenty of room for knees and chairs. Ideal for smaller dining rooms and breakfast nooks.",
    dimensions: "Ø 120 × H 75 cm",
    materials: "Solid oak top, turned oak pedestal",
    care: CARE_WOOD,
    tags: ["table", "new"],
    ageDays: 9,
    salesCount: 28,
    colors: [OAK, BLACK_ASH],
  },
  {
    slug: "linden-dining-chair",
    title: "Linden Dining Chair",
    category: "dining-room",
    kind: "dining-chair",
    priceCents: 29900,
    summary: "A comfortable dining chair with a curved backrest and padded seat.",
    description:
      "Linden's curved backrest supports you through long dinners. Sold individually — mix colours for a relaxed look.",
    dimensions: "W 50 × D 54 × H 80 cm · Seat height 46 cm",
    materials: "Solid oak frame, padded seat in performance fabric",
    care: CARE_WOOD,
    tags: ["chair"],
    ageDays: 70,
    salesCount: 260,
    colors: [SAGE, OAT, CHARCOAL],
  },
  {
    slug: "oda-bar-stool",
    title: "Oda Bar Stool",
    category: "dining-room",
    kind: "stool",
    priceCents: 24900,
    summary: "A counter-height stool with a saddle seat and footrest.",
    description:
      "Oda's saddle-shaped seat is surprisingly comfortable, and the footrest ring is set at just the right height.",
    dimensions: "W 42 × D 40 × H 66 cm (counter height)",
    materials: "Solid oak or walnut",
    care: CARE_WOOD,
    tags: ["stool"],
    ageDays: 110,
    salesCount: 97,
    colors: [OAK, WALNUT],
  },
  {
    slug: "pia-sideboard",
    title: "Pia Sideboard",
    category: "dining-room",
    kind: "sideboard",
    priceCents: 149900,
    compareAtCents: 169900,
    summary: "A four-door sideboard with cane-panelled doors.",
    description:
      "Pia's cane panels let the cabinet breathe and add a soft texture to the dining room. Adjustable shelves fit tableware of every size.",
    dimensions: "W 170 × D 45 × H 78 cm",
    materials: "Solid oak frame, natural cane panels, adjustable shelves",
    care: CARE_WOOD,
    tags: ["storage", "sale"],
    ageDays: 150,
    salesCount: 31,
    tone: "#B98E62",
  },
  {
    slug: "reed-dining-bench",
    title: "Reed Dining Bench",
    category: "dining-room",
    kind: "bench",
    priceCents: 49900,
    summary: "A solid wood bench that seats three along the table.",
    description:
      "Reed slides neatly under the Calder table and seats three. The softened edges are kind to the backs of your knees.",
    dimensions: "W 180 × D 38 × H 45 cm",
    materials: "Solid oak or walnut",
    care: CARE_WOOD,
    tags: ["bench"],
    ageDays: 95,
    salesCount: 44,
    colors: [OAK, WALNUT],
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

/** File name (under /seed/) of a product image for a colour (or the single tone) and view. */
export function productImageName(product: SeedProduct, color: SeedColor | null, view: 1 | 2) {
  return `products/${product.slug}${color ? `-${slugify(color.name)}` : ""}-${view}.webp`;
}

export const REVIEW_SNIPPETS: { rating: number; title: string; body: string; name: string }[] = [
  {
    rating: 5,
    title: "Even better in person",
    body: "The fabric is gorgeous and the colour is exactly as pictured. Delivery was quick and the team carried it in for us.",
    name: "Amelia R.",
  },
  {
    rating: 5,
    title: "Our favourite piece",
    body: "We've had it for three months now and it still looks brand new. Comfortable, solid and beautifully finished.",
    name: "Daniel K.",
  },
  {
    rating: 4,
    title: "Lovely quality",
    body: "Really well made and very comfortable. Took a little longer to arrive than expected, but worth the wait.",
    name: "Priya S.",
  },
  {
    rating: 5,
    title: "Worth every penny",
    body: "You can tell it's built to last — the joinery is excellent and the finish is flawless. Highly recommend.",
    name: "Marcus L.",
  },
  {
    rating: 4,
    title: "Calm and beautiful",
    body: "It fits our space perfectly and brings such a calm feel to the room. Assembly was simple.",
    name: "Hannah W.",
  },
  {
    rating: 3,
    title: "Nice but firm",
    body: "Looks great and feels sturdy. A little firmer than I expected, though it is softening up with use.",
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
    body: "Good build quality but the colour is a touch darker than on my screen. Customer service was helpful though.",
    name: "Ben A.",
  },
];
