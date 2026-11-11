import type {
  AddOn,
  GalleryFlower,
  Product,
  ProductVariant,
  Review,
  RibbonOption,
  SizeTier,
  Taxonomies,
  WrapOption,
} from "../types";
import { IMG } from "./images";

/* ───────── Master lists (FR-CUST-01.2 / 01.3) ───────── */
export const taxonomies: Taxonomies = {
  occasions: [
    { slug: "birthday", name: "Birthday", image: IMG.yellowPink },
    { slug: "anniversary", name: "Anniversary", image: IMG.redRoses1 },
    { slug: "valentines-day", name: "Valentine's Day", image: IMG.tulipsPaper },
    { slug: "wedding", name: "Wedding / Bridal", image: IMG.brideBouquet },
    { slug: "sympathy", name: "Sympathy / Funeral", image: IMG.whiteLily },
    { slug: "congratulations", name: "Congratulations", image: IMG.sunflowerBasket },
    { slug: "get-well-soon", name: "Get Well Soon", image: IMG.pinkTulips },
  ],
  flowerTypes: [
    { slug: "roses", name: "Roses" },
    { slug: "lilies", name: "Lilies" },
    { slug: "orchids", name: "Orchids" },
    { slug: "chrysanthemums", name: "Chrysanthemums" },
    { slug: "carnations", name: "Carnations" },
    { slug: "sunflowers", name: "Sunflowers" },
    { slug: "mixed-seasonal", name: "Mixed Seasonal" },
  ],
  styles: [
    { slug: "hand-tied", name: "Hand-tied" },
    { slug: "box", name: "Box" },
    { slug: "vase", name: "Vase" },
    { slug: "basket", name: "Basket" },
    { slug: "wreath", name: "Wreath" },
    { slug: "single-stem", name: "Single Stem" },
  ],
  colours: [
    { slug: "red", name: "Red", hex: "#b4232f" },
    { slug: "pastel-pink", name: "Pastel Pink", hex: "#f4b6c5" },
    { slug: "white", name: "White", hex: "#f7f4ee" },
    { slug: "yellow", name: "Yellow", hex: "#f2c94c" },
    { slug: "purple", name: "Purple", hex: "#8e6bb8" },
    { slug: "mixed", name: "Mixed", hex: "conic-gradient(#f4b6c5,#f2c94c,#b4232f,#8e6bb8,#f4b6c5)" },
  ],
};

/* ───────── Personalisation (FR-CUST-02.2 / 02.3) ───────── */
export const wraps: WrapOption[] = [
  { id: "wrap-kraft", name: "Kraft", description: "Natural brown paper, rustic and timeless", price: 0, available: true, swatch: "#c8a77e" },
  { id: "wrap-frosted", name: "Frosted waterproof", description: "Soft matte film that keeps stems fresh", price: 450, available: true, swatch: "#eef0f2" },
  { id: "wrap-burlap", name: "Burlap", description: "Textured jute with a handmade feel", price: 350, available: false, swatch: "#a88d67" },
];

export const ribbons: RibbonOption[] = [
  { id: "rib-blush", name: "Blush", hex: "#f095a8" },
  { id: "rib-ivory", name: "Ivory", hex: "#f4efe4" },
  { id: "rib-crimson", name: "Crimson", hex: "#9f1d2e" },
  { id: "rib-sage", name: "Sage", hex: "#93a487" },
  { id: "rib-black", name: "Black", hex: "#1b1714" },
  { id: "rib-gold", name: "Gold", hex: "#c9a24a" },
];

export const addOns: AddOn[] = [
  { id: "add-choc", name: "Belgian chocolates (12 pcs)", price: 2400, image: IMG.rosePetals, available: true },
  { id: "add-teddy", name: "Teddy bear (30 cm)", price: 2900, image: IMG.pinkFlower, available: true },
  { id: "add-card", name: "Premium greeting card", price: 450, image: IMG.whitePinkArrangement, available: true },
  { id: "add-topper", name: "Acrylic name topper", price: 1200, image: IMG.pinkSingle, available: true },
  { id: "add-vase", name: "Glass vase", price: 1800, image: IMG.whiteGlassVase, available: false },
];

/* ───────── Custom bouquet gallery (FR-CUST-03.1) ───────── */
export const galleryFlowers: GalleryFlower[] = [
  { id: "gf-red-rose", name: "Red Rose", colour: "Red", hex: "#b4232f", image: IMG.redRose, indicativePrice: 350, kind: "FLOWER" },
  { id: "gf-pink-rose", name: "Pink Rose", colour: "Pastel Pink", hex: "#f4b6c5", image: IMG.pinkRosesClose, indicativePrice: 380, kind: "FLOWER" },
  { id: "gf-coral-rose", name: "Coral Rose", colour: "Mixed", hex: "#f08a6c", image: IMG.coralRose, indicativePrice: 400, kind: "FLOWER" },
  { id: "gf-white-lily", name: "White Lily", colour: "White", hex: "#f7f4ee", image: IMG.whiteLily, indicativePrice: 600, kind: "FLOWER" },
  { id: "gf-pink-lily", name: "Pink Lily", colour: "Pastel Pink", hex: "#f4b6c5", image: IMG.pinkLilies, indicativePrice: 620, kind: "FLOWER" },
  { id: "gf-pink-tulip", name: "Pink Tulip", colour: "Pastel Pink", hex: "#f4b6c5", image: IMG.pinkTulips, indicativePrice: 450, kind: "FLOWER" },
  { id: "gf-white-tulip", name: "White Tulip", colour: "White", hex: "#f7f4ee", image: IMG.whiteTulips, indicativePrice: 450, kind: "FLOWER" },
  { id: "gf-sunflower", name: "Sunflower", colour: "Yellow", hex: "#f2c94c", image: IMG.sunflowerBasket, indicativePrice: 400, kind: "FLOWER" },
  { id: "gf-carnation", name: "Carnation", colour: "Pastel Pink", hex: "#f4b6c5", image: IMG.pinkYellow, indicativePrice: 220, kind: "FLOWER" },
  { id: "gf-chrysanthemum", name: "Chrysanthemum", colour: "White", hex: "#f7f4ee", image: IMG.whiteFlowers, indicativePrice: 200, kind: "FLOWER" },
  { id: "gf-orchid", name: "Dendrobium Orchid", colour: "Purple", hex: "#8e6bb8", image: IMG.pinkSingle, indicativePrice: 750, kind: "FLOWER" },
  { id: "gf-babys-breath", name: "Baby's Breath", colour: "White", hex: "#f7f4ee", image: IMG.roseBabysBreath, indicativePrice: 150, kind: "FILLER" },
  { id: "gf-eucalyptus", name: "Eucalyptus", colour: "Green", hex: "#93a487", image: IMG.whiteBeige, indicativePrice: 180, kind: "FILLER" },
  { id: "gf-ruscus", name: "Italian Ruscus", colour: "Green", hex: "#6f8a5f", image: IMG.tableBunch, indicativePrice: 120, kind: "FILLER" },
];

/* ───────── Products ───────── */
const tierMult: Record<SizeTier, number> = { STANDARD: 1, DELUXE: 1.4, PREMIUM: 1.9, LUXURY: 2.7 };
const tierStems: Record<SizeTier, number> = { STANDARD: 1, DELUXE: 1.5, PREMIUM: 2, LUXURY: 3 };
const tiers: SizeTier[] = ["STANDARD", "DELUXE", "PREMIUM", "LUXURY"];

function variants(id: string, base: number, stems: number, opts: { sale?: boolean; inactive?: SizeTier[] } = {}): ProductVariant[] {
  return tiers.map((t) => {
    const price = Math.round((base * tierMult[t]) / 50) * 50;
    return {
      id: `${id}-${t.toLowerCase()}`,
      sizeTier: t,
      price,
      salePrice: opts.sale && t === "STANDARD" ? Math.round((price * 0.88) / 50) * 50 : undefined,
      stemCount: Math.round(stems * tierStems[t]),
      isActive: !(opts.inactive ?? []).includes(t),
    };
  });
}

const reviewPool: Omit<Review, "id">[] = [
  { author: "Nadeesha P.", rating: 5, body: "Arrived exactly in the morning slot and looked even better than the photos. My mother was in tears!", date: "2026-10-28", verified: true },
  { author: "Kasun W.", rating: 5, body: "Paid by bank transfer, slip was approved within the hour. Super smooth and the flowers lasted over a week.", date: "2026-10-21", verified: true },
  { author: "Ishara D.", rating: 4, body: "Beautiful wrapping and the card was handwritten. Would love a few more stems in the Standard size.", date: "2026-10-12", verified: true },
  { author: "Malsha F.", rating: 5, body: "The anonymous sender option made the surprise perfect. Tracking link was a nice touch.", date: "2026-09-30", verified: true },
  { author: "Ravindu S.", rating: 5, body: "Ordered for our anniversary two days ahead — fresh, fragrant, and the rider was very polite.", date: "2026-09-18", verified: true },
];
const reviews = (seed: number, n: number): Review[] =>
  Array.from({ length: n }, (_, i) => ({ id: `rv-${seed}-${i}`, ...reviewPool[(seed + i) % reviewPool.length] }));

const care = [
  "Trim 2 cm off each stem at an angle before placing in water.",
  "Change the water every two days and keep away from direct sunlight.",
  "Remove any leaves that sit below the water line.",
  "Keep away from ripening fruit — it shortens bloom life.",
];

export const products: Product[] = [
  {
    id: "p1", sku: "SF-HT-001", slug: "crimson-romance", name: "Crimson Romance",
    tagline: "Velvet red roses, hand-tied with love",
    description: "Our signature bouquet of long-stem red roses, hand-tied with fresh ruscus and wrapped in your choice of paper. A timeless way to say everything at once.",
    careTips: care, images: [IMG.redRoses1, IMG.redRoses2, IMG.redRose],
    occasions: ["anniversary", "valentines-day"], flowerTypes: ["roses"], style: "hand-tied", colours: ["red"],
    variants: variants("p1", 7500, 12), isAvailable: true, isFeatured: true, popularity: 98, createdAt: "2026-06-02",
    rating: 4.9, reviewCount: 214, reviews: reviews(0, 4),
  },
  {
    id: "p2", sku: "SF-HT-002", slug: "blush-whisper", name: "Blush Whisper",
    tagline: "Pink roses in a cloud of baby's breath",
    description: "Soft pink roses nestled in airy baby's breath — gentle, romantic and endlessly photogenic. Finished with a blush satin ribbon.",
    careTips: care, images: [IMG.roseBabysBreath, IMG.pinkWhiteRoseBouquet, IMG.pinkRoseTable],
    occasions: ["birthday", "anniversary"], flowerTypes: ["roses"], style: "hand-tied", colours: ["pastel-pink"],
    variants: variants("p2", 6800, 10, { sale: true }), isAvailable: true, isFeatured: true, popularity: 96, createdAt: "2026-08-14",
    rating: 4.9, reviewCount: 187, reviews: reviews(1, 4),
  },
  {
    id: "p3", sku: "SF-HT-003", slug: "pearl-promise", name: "Pearl Promise",
    tagline: "A bridal bouquet in ivory and blush",
    description: "Designed for the aisle: ivory roses, blush spray roses and delicate greens, gathered into a graceful round bouquet with a silk-wrapped handle.",
    careTips: care, images: [IMG.brideBouquet, IMG.womanBouquet, IMG.whiteBeige],
    occasions: ["wedding"], flowerTypes: ["roses", "mixed-seasonal"], style: "hand-tied", colours: ["white", "pastel-pink"],
    variants: variants("p3", 12500, 15), isAvailable: true, isFeatured: true, popularity: 84, createdAt: "2026-05-20",
    rating: 5, reviewCount: 66, reviews: reviews(2, 3),
  },
  {
    id: "p4", sku: "SF-BK-001", slug: "sunlit-basket", name: "Sunlit Basket",
    tagline: "Golden sunflowers in a woven basket",
    description: "A cheerful basket of sunflowers and seasonal yellows — instant sunshine for a new job, a recovery or simply a Tuesday.",
    careTips: care, images: [IMG.sunflowerBasket, IMG.yellowPink],
    occasions: ["congratulations", "get-well-soon", "birthday"], flowerTypes: ["sunflowers"], style: "basket", colours: ["yellow"],
    variants: variants("p4", 8200, 8), isAvailable: true, isFeatured: true, popularity: 90, createdAt: "2026-09-01",
    rating: 4.8, reviewCount: 98, reviews: reviews(3, 3),
  },
  {
    id: "p5", sku: "SF-VS-001", slug: "tulip-sonnet", name: "Tulip Sonnet",
    tagline: "Pink tulips in a clear glass vase",
    description: "Imported pink tulips arranged loose and natural in a clear vase — they keep growing and opening for days after delivery.",
    careTips: care, images: [IMG.pinkTulips, IMG.pinkTulipsWhite, IMG.pinkVase],
    occasions: ["birthday", "get-well-soon"], flowerTypes: ["mixed-seasonal"], style: "vase", colours: ["pastel-pink"],
    variants: variants("p5", 9500, 10), isAvailable: true, isFeatured: true, isNew: true, popularity: 88, createdAt: "2026-10-30",
    rating: 4.8, reviewCount: 41, reviews: reviews(4, 3),
  },
  {
    id: "p6", sku: "SF-VS-002", slug: "lily-serenity", name: "Lily Serenity",
    tagline: "White lilies for quiet moments",
    description: "Fragrant white lilies with soft greens, arranged in a simple vase. A calm, respectful tribute or a peaceful gift for a recovering friend.",
    careTips: care, images: [IMG.whiteLily, IMG.whiteGlassVase],
    occasions: ["sympathy", "get-well-soon"], flowerTypes: ["lilies"], style: "vase", colours: ["white"],
    variants: variants("p6", 8900, 6), isAvailable: true, isFeatured: false, popularity: 72, createdAt: "2026-04-11",
    rating: 4.9, reviewCount: 57, reviews: reviews(0, 2),
  },
  {
    id: "p7", sku: "SF-BX-001", slug: "garden-in-a-box", name: "Garden in a Box",
    tagline: "A keepsake box of mixed blooms",
    description: "Roses, carnations and seasonal blooms packed tight in a wooden keepsake box — no vase needed, just add a splash of water to the foam.",
    careTips: care, images: [IMG.flowerBox, IMG.whitePinkArrangement],
    occasions: ["birthday", "anniversary"], flowerTypes: ["mixed-seasonal", "roses"], style: "box", colours: ["pastel-pink", "mixed"],
    variants: variants("p7", 10500, 18), isAvailable: true, isFeatured: true, isNew: true, popularity: 86, createdAt: "2026-11-01",
    rating: 4.7, reviewCount: 23, reviews: reviews(1, 2),
  },
  {
    id: "p8", sku: "SF-HT-004", slug: "coral-crush", name: "Coral Crush",
    tagline: "Orange, coral and pink roses",
    description: "A sunset in a bouquet — warm coral, peach and pink roses tied with eucalyptus. Bright, modern and impossible to ignore.",
    careTips: care, images: [IMG.coralRose, IMG.roseVase],
    occasions: ["birthday", "congratulations"], flowerTypes: ["roses"], style: "hand-tied", colours: ["mixed"],
    variants: variants("p8", 7900, 12), isAvailable: true, isFeatured: true, popularity: 82, createdAt: "2026-07-08",
    rating: 4.8, reviewCount: 76, reviews: reviews(2, 3),
  },
  {
    id: "p9", sku: "SF-WR-001", slug: "peaceful-wreath", name: "Peaceful Wreath",
    tagline: "White chrysanthemums and greens",
    description: "A traditional standing wreath of white chrysanthemums and foliage, made with care for funerals and remembrance.",
    careTips: care.slice(0, 2), images: [IMG.whiteFlowers, IMG.whiteFlower],
    occasions: ["sympathy"], flowerTypes: ["chrysanthemums"], style: "wreath", colours: ["white"],
    variants: variants("p9", 11500, 40, { inactive: ["LUXURY"] }), isAvailable: true, isFeatured: false, popularity: 61, createdAt: "2026-03-02",
    rating: 4.9, reviewCount: 34, reviews: reviews(3, 2),
  },
  {
    id: "p10", sku: "SF-VS-003", slug: "pink-lily-bliss", name: "Pink Lily Bliss",
    tagline: "Stargazer lilies in full bloom",
    description: "Statement pink lilies with deep freckled centres — dramatic, fragrant and perfect for big congratulations.",
    careTips: care, images: [IMG.pinkLilies, IMG.pinkLilyVase],
    occasions: ["anniversary", "congratulations"], flowerTypes: ["lilies"], style: "vase", colours: ["pastel-pink"],
    variants: variants("p10", 9200, 6), isAvailable: true, isFeatured: false, popularity: 70, createdAt: "2026-08-25",
    rating: 4.7, reviewCount: 29, reviews: reviews(4, 2),
  },
  {
    id: "p11", sku: "SF-VS-004", slug: "market-medley", name: "Market Medley",
    tagline: "The florist's choice of the week",
    description: "Whatever is freshest at the morning market, arranged by our head florist. Every one is different — that is the joy of it.",
    careTips: care, images: [IMG.multiVase, IMG.assorted, IMG.assortedVase],
    occasions: ["congratulations", "birthday"], flowerTypes: ["mixed-seasonal"], style: "vase", colours: ["mixed"],
    variants: variants("p11", 6500, 14, { sale: true }), isAvailable: true, isFeatured: false, popularity: 79, createdAt: "2026-10-05",
    rating: 4.8, reviewCount: 112, reviews: reviews(0, 3),
  },
  {
    id: "p12", sku: "SF-HT-005", slug: "tulips-in-paper", name: "Tulips in Paper",
    tagline: "Red tulips wrapped in kraft",
    description: "A bundle of red and pink tulips wrapped simply in kraft paper and twine — effortless, editorial and very Valentine's.",
    careTips: care, images: [IMG.tulipsPaper, IMG.mixedTulips],
    occasions: ["valentines-day", "birthday"], flowerTypes: ["mixed-seasonal"], style: "hand-tied", colours: ["red", "pastel-pink"],
    variants: variants("p12", 8800, 10), isAvailable: true, isFeatured: false, popularity: 77, createdAt: "2026-09-12",
    rating: 4.6, reviewCount: 38, reviews: reviews(1, 2),
  },
  {
    id: "p13", sku: "SF-SS-001", slug: "single-red-rose", name: "The Single Rose",
    tagline: "One perfect long-stem rose",
    description: "Sometimes one is enough. A single premium long-stem rose in a slim sleeve with ribbon and a message card.",
    careTips: care.slice(0, 2), images: [IMG.redRose, IMG.rosePetals],
    occasions: ["valentines-day", "anniversary"], flowerTypes: ["roses"], style: "single-stem", colours: ["red"],
    variants: variants("p13", 1500, 1, { inactive: ["PREMIUM", "LUXURY"] }), isAvailable: true, isFeatured: false, popularity: 75, createdAt: "2026-01-20",
    rating: 4.7, reviewCount: 145, reviews: reviews(2, 2),
  },
  {
    id: "p14", sku: "SF-VS-005", slug: "carnation-charm", name: "Carnation Charm",
    tagline: "Ruffled carnations in pink and butter",
    description: "Frilly pink and butter-yellow carnations — long-lasting, cheerful and great value. A get-well favourite.",
    careTips: care, images: [IMG.pinkYellow, IMG.pinkCenterpiece],
    occasions: ["get-well-soon", "birthday"], flowerTypes: ["carnations"], style: "vase", colours: ["pastel-pink", "yellow"],
    variants: variants("p14", 5900, 15), isAvailable: true, isFeatured: false, popularity: 68, createdAt: "2026-07-30",
    rating: 4.6, reviewCount: 52, reviews: reviews(3, 2),
  },
  {
    id: "p15", sku: "SF-HT-006", slug: "orchid-dream", name: "Orchid Dream",
    tagline: "Dendrobium orchids with blush roses",
    description: "Elegant purple dendrobium orchids paired with blush roses for a lush, tropical statement bouquet.",
    careTips: care, images: [IMG.pinkSingle, IMG.pinkFlower],
    occasions: ["anniversary", "congratulations"], flowerTypes: ["orchids", "roses"], style: "hand-tied", colours: ["purple", "pastel-pink"],
    variants: variants("p15", 11800, 10), isAvailable: false, isFeatured: false, popularity: 66, createdAt: "2026-06-18",
    rating: 4.8, reviewCount: 19, reviews: reviews(4, 2),
  },
  {
    id: "p16", sku: "SF-BX-002", slug: "velvet-noir", name: "Velvet Noir",
    tagline: "Deep reds and blush on black",
    description: "Dark, moody and luxurious: deep red and blush roses set in a matte black hat box.",
    careTips: care, images: [IMG.pinkWhiteDark, IMG.centerpiece],
    occasions: ["anniversary", "valentines-day"], flowerTypes: ["roses"], style: "box", colours: ["red", "mixed"],
    variants: variants("p16", 13500, 20), isAvailable: true, isFeatured: true, popularity: 80, createdAt: "2026-10-18",
    rating: 4.9, reviewCount: 31, reviews: reviews(0, 2),
  },
];

export const heroStrip: string[] = [
  IMG.sunflowerBasket,
  IMG.roseBabysBreath,
  IMG.pinkCenterpiece,
  IMG.whiteBeige,
  IMG.whiteLily,
  IMG.coralRose,
  IMG.pinkTulips,
  IMG.flowerBox,
];
