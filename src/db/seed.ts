import { db } from "./client.ts";

async function ensureAdmin() {
  const [existingAdmin] = await db`SELECT 1 FROM admin_users LIMIT 1`;
  if (existingAdmin) return;

  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) throw new Error("ADMIN_INITIAL_PASSWORD is required to seed the initial admin");

  const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt" });
  await db`INSERT INTO admin_users (username, password_hash) VALUES ('admin', ${passwordHash})`;
}

export async function seed() {
  const [existingCategories] = await db`SELECT COUNT(*)::int AS count FROM categories`;
  if (existingCategories.count > 0) {
    await ensureAdmin();
    return;
  }

  const categories = [
    {
      name: "Hats",
      slug: "hats",
      description: "Caps, beanies, and headwear for every style",
      sort_order: 1,
      image_url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&h=450&fit=crop",
    },
    {
      name: "T-Shirts",
      slug: "t-shirts",
      description: "Casual tees for everyday comfort",
      sort_order: 2,
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=450&fit=crop",
    },
    {
      name: "Shirts",
      slug: "shirts",
      description: "Button-ups and dress shirts",
      sort_order: 3,
      image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=450&fit=crop",
    },
    {
      name: "Jackets & Coats",
      slug: "jackets-coats",
      description: "Outerwear for all seasons",
      sort_order: 4,
      image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=450&fit=crop",
    },
    {
      name: "Hoodies & Sweaters",
      slug: "hoodies-sweaters",
      description: "Cozy layers for cooler days",
      sort_order: 5,
      image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=450&fit=crop",
    },
    {
      name: "Pants",
      slug: "pants",
      description: "Chinos, trousers, and joggers",
      sort_order: 6,
      image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=450&fit=crop",
    },
    {
      name: "Jeans",
      slug: "jeans",
      description: "Denim in every fit",
      sort_order: 7,
      image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=450&fit=crop",
    },
    {
      name: "Shorts",
      slug: "shorts",
      description: "Casual and athletic shorts",
      sort_order: 8,
      image_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=450&fit=crop",
    },
    {
      name: "Dresses",
      slug: "dresses",
      description: "From casual to formal",
      sort_order: 9,
      image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=450&fit=crop",
    },
    {
      name: "Skirts",
      slug: "skirts",
      description: "Mini, midi, and maxi styles",
      sort_order: 10,
      image_url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=450&fit=crop",
    },
    {
      name: "Shoes",
      slug: "shoes",
      description: "Sneakers, boots, and sandals",
      sort_order: 11,
      image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=450&fit=crop",
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Belts, bags, scarves, and more",
      sort_order: 12,
      image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=450&fit=crop",
    },
  ];

  for (const cat of categories) {
    await db`INSERT INTO categories (name, slug, description, sort_order, image_url)
      VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.sort_order}, ${cat.image_url})`;
  }

  const products = [
    // ── Hats ──────────────────────────────────────────────────────────────
    {
      name: "Classic Baseball Cap",
      slug: "classic-baseball-cap",
      description: "A timeless cotton baseball cap with adjustable strap.",
      price: 24.99,
      category_slug: "hats",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1620231109648-302d034cb29b?w=500&h=500&fit=crop",
    },
    {
      name: "Wool Beanie",
      slug: "wool-beanie",
      description: "Cozy ribbed beanie in 100% merino wool. One size fits all.",
      price: 29.99,
      category_slug: "hats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&h=500&fit=crop",
    },
    {
      name: "Wide-Brim Sun Hat",
      slug: "wide-brim-sun-hat",
      description: "Packable straw hat with a wide brim for sun protection.",
      price: 34.99,
      compare_at_price: 44.99,
      category_slug: "hats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=500&h=500&fit=crop",
    },
    {
      name: "Snapback Cap",
      slug: "snapback-cap",
      description: "Structured 6-panel cap with flat brim and snap closure.",
      price: 27.99,
      category_slug: "hats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500&h=500&fit=crop",
    },

    // ── T-Shirts ───────────────────────────────────────────────────────────
    {
      name: "Essential Crew Tee",
      slug: "essential-crew-tee",
      description: "Soft cotton crew-neck tee, available in multiple colors.",
      price: 19.99,
      category_slug: "t-shirts",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    },
    {
      name: "Graphic Print Tee",
      slug: "graphic-print-tee",
      description: "Bold graphic print on premium combed cotton. Relaxed fit.",
      price: 29.99,
      category_slug: "t-shirts",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop",
    },
    {
      name: "V-Neck Pocket Tee",
      slug: "v-neck-pocket-tee",
      description: "Lightweight V-neck tee with a chest pocket. Perfect for layering.",
      price: 22.99,
      category_slug: "t-shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=500&fit=crop",
    },
    {
      name: "Oversized Drop-Shoulder Tee",
      slug: "oversized-drop-shoulder-tee",
      description: "Relaxed oversized silhouette with drop shoulders and raw hem.",
      price: 32.99,
      compare_at_price: 39.99,
      category_slug: "t-shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&h=500&fit=crop",
    },
    {
      name: "Striped Breton Tee",
      slug: "striped-breton-tee",
      description: "Classic sailor stripes on a soft cotton jersey. A French staple.",
      price: 24.99,
      category_slug: "t-shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=500&fit=crop",
    },

    // ── Shirts ─────────────────────────────────────────────────────────────
    {
      name: "Oxford Button-Down",
      slug: "oxford-button-down",
      description: "Classic oxford cloth button-down shirt for a polished look.",
      price: 59.99,
      category_slug: "shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=500&fit=crop",
    },
    {
      name: "Linen Summer Shirt",
      slug: "linen-summer-shirt",
      description: "Breathable linen shirt with a relaxed fit, ideal for warm weather.",
      price: 54.99,
      category_slug: "shirts",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop",
    },
    {
      name: "Flannel Plaid Shirt",
      slug: "flannel-plaid-shirt",
      description: "Soft brushed flannel in a classic plaid pattern. Double-chest pockets.",
      price: 64.99,
      compare_at_price: 79.99,
      category_slug: "shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1608744882201-52a7f7f3dd60?w=500&h=500&fit=crop",
    },
    {
      name: "Cuban Collar Shirt",
      slug: "cuban-collar-shirt",
      description: "Short-sleeve Cuban collar shirt in a relaxed camp style.",
      price: 49.99,
      category_slug: "shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&h=500&fit=crop",
    },

    // ── Jackets & Coats ────────────────────────────────────────────────────
    {
      name: "Classic Denim Jacket",
      slug: "classic-denim-jacket",
      description: "Iconic denim jacket with a modern fit. A wardrobe staple.",
      price: 89.99,
      compare_at_price: 110.0,
      category_slug: "jackets-coats",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&h=500&fit=crop",
    },
    {
      name: "Wool Overcoat",
      slug: "wool-overcoat",
      description: "Tailored double-breasted overcoat in a wool-cashmere blend.",
      price: 249.99,
      compare_at_price: 299.99,
      category_slug: "jackets-coats",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&h=500&fit=crop",
    },
    {
      name: "Bomber Jacket",
      slug: "bomber-jacket",
      description: "Ribbed-cuff satin bomber with an embroidered back panel.",
      price: 119.99,
      category_slug: "jackets-coats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=500&fit=crop",
    },
    {
      name: "Puffer Vest",
      slug: "puffer-vest",
      description: "Lightweight quilted vest with down-alternative fill. Packable.",
      price: 74.99,
      category_slug: "jackets-coats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop",
    },
    {
      name: "Trench Coat",
      slug: "trench-coat",
      description: "Classic belted trench coat in water-resistant cotton gabardine.",
      price: 179.99,
      compare_at_price: 219.99,
      category_slug: "jackets-coats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=500&h=500&fit=crop",
    },

    // ── Hoodies & Sweaters ─────────────────────────────────────────────────
    {
      name: "Pullover Hoodie",
      slug: "pullover-hoodie",
      description: "Heavyweight fleece hoodie with kangaroo pocket.",
      price: 54.99,
      category_slug: "hoodies-sweaters",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop",
    },
    {
      name: "Zip-Up Hoodie",
      slug: "zip-up-hoodie",
      description: "Midweight full-zip hoodie with two hand pockets and ribbed cuffs.",
      price: 59.99,
      category_slug: "hoodies-sweaters",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=500&h=500&fit=crop",
    },
    {
      name: "Cable-Knit Sweater",
      slug: "cable-knit-sweater",
      description: "Classic cable-knit crewneck in soft lambswool blend.",
      price: 84.99,
      compare_at_price: 99.99,
      category_slug: "hoodies-sweaters",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop",
    },
    {
      name: "Cropped Sweatshirt",
      slug: "cropped-sweatshirt",
      description: "Cropped French-terry sweatshirt with raw-edge hem.",
      price: 44.99,
      category_slug: "hoodies-sweaters",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop",
    },

    // ── Pants ──────────────────────────────────────────────────────────────
    {
      name: "Slim Chino Pants",
      slug: "slim-chino-pants",
      description: "Slim-fit chinos in stretch cotton twill.",
      price: 49.99,
      category_slug: "pants",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=500&fit=crop",
    },
    {
      name: "Tailored Trousers",
      slug: "tailored-trousers",
      description: "Sharply tailored flat-front trousers in stretch wool.",
      price: 89.99,
      compare_at_price: 109.99,
      category_slug: "pants",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=500&fit=crop",
    },
    {
      name: "Jogger Sweatpants",
      slug: "jogger-sweatpants",
      description: "Tapered joggers in French terry with elastic waistband and cuffs.",
      price: 44.99,
      category_slug: "pants",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&h=500&fit=crop",
    },
    {
      name: "Cargo Pants",
      slug: "cargo-pants",
      description: "Relaxed-fit cargo pants with six pockets in durable ripstop fabric.",
      price: 64.99,
      category_slug: "pants",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=500&h=500&fit=crop",
    },

    // ── Jeans ──────────────────────────────────────────────────────────────
    {
      name: "Straight Fit Jeans",
      slug: "straight-fit-jeans",
      description: "Classic straight-fit jeans in medium wash denim.",
      price: 69.99,
      category_slug: "jeans",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop",
    },
    {
      name: "Slim Taper Jeans",
      slug: "slim-taper-jeans",
      description: "Slim through the hip and thigh, tapered to the ankle. Stretch denim.",
      price: 74.99,
      category_slug: "jeans",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=500&h=500&fit=crop",
    },
    {
      name: "Wide-Leg Jeans",
      slug: "wide-leg-jeans",
      description: "High-rise wide-leg jeans in a vintage dark wash.",
      price: 79.99,
      compare_at_price: 94.99,
      category_slug: "jeans",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500&h=500&fit=crop",
    },
    {
      name: "Distressed Skinny Jeans",
      slug: "distressed-skinny-jeans",
      description: "Skinny jeans with intentional distressing at the knees.",
      price: 64.99,
      category_slug: "jeans",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop",
    },

    // ── Shorts ─────────────────────────────────────────────────────────────
    {
      name: "Athletic Shorts",
      slug: "athletic-shorts",
      description: "Lightweight performance shorts with built-in liner.",
      price: 34.99,
      category_slug: "shorts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=500&fit=crop",
    },
    {
      name: "Chino Shorts",
      slug: "chino-shorts",
      description: "5-inch inseam chino shorts in stretch cotton. Weekend essential.",
      price: 39.99,
      category_slug: "shorts",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&h=500&fit=crop",
    },
    {
      name: "Denim Cutoff Shorts",
      slug: "denim-cutoff-shorts",
      description: "Relaxed-fit cutoff shorts made from upcycled denim.",
      price: 44.99,
      compare_at_price: 54.99,
      category_slug: "shorts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
    },
    {
      name: "Linen Shorts",
      slug: "linen-shorts",
      description: "Relaxed linen shorts with a drawstring waist for casual summer days.",
      price: 37.99,
      category_slug: "shorts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=500&h=500&fit=crop",
    },

    // ── Dresses ────────────────────────────────────────────────────────────
    {
      name: "Wrap Midi Dress",
      slug: "wrap-midi-dress",
      description: "Flattering wrap silhouette in a versatile midi length.",
      price: 79.99,
      category_slug: "dresses",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop",
    },
    {
      name: "Slip Dress",
      slug: "slip-dress",
      description: "Minimalist satin slip dress with adjustable straps. Wear day or night.",
      price: 69.99,
      category_slug: "dresses",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=500&fit=crop",
    },
    {
      name: "Floral Maxi Dress",
      slug: "floral-maxi-dress",
      description: "Flowy maxi dress in a vibrant floral print. Elastic waistband.",
      price: 89.99,
      compare_at_price: 109.99,
      category_slug: "dresses",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=500&h=500&fit=crop",
    },
    {
      name: "Shirt Dress",
      slug: "shirt-dress",
      description: "Belted shirt dress in crisp cotton poplin. Knee-length hem.",
      price: 74.99,
      category_slug: "dresses",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500&h=500&fit=crop",
    },

    // ── Skirts ─────────────────────────────────────────────────────────────
    {
      name: "Pleated Mini Skirt",
      slug: "pleated-mini-skirt",
      description: "Playful pleated mini skirt in a lightweight fabric.",
      price: 39.99,
      category_slug: "skirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1592301933927-35b597393c0a?w=500&h=500&fit=crop",
    },
    {
      name: "A-Line Midi Skirt",
      slug: "a-line-midi-skirt",
      description: "Elegant A-line midi skirt with a back slit. Lined interior.",
      price: 54.99,
      category_slug: "skirts",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=500&fit=crop",
    },
    {
      name: "Denim Maxi Skirt",
      slug: "denim-maxi-skirt",
      description: "Floor-length denim skirt with a front button placket.",
      price: 64.99,
      compare_at_price: 79.99,
      category_slug: "skirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=500&h=500&fit=crop",
    },
    {
      name: "Satin Wrap Skirt",
      slug: "satin-wrap-skirt",
      description: "Luxurious satin wrap skirt with an adjustable tie. Easy to style.",
      price: 49.99,
      category_slug: "skirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=500&h=500&fit=crop",
    },

    // ── Shoes ──────────────────────────────────────────────────────────────
    {
      name: "Canvas Sneakers",
      slug: "canvas-sneakers",
      description: "Classic low-top canvas sneakers with vulcanized sole.",
      price: 44.99,
      category_slug: "shoes",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=500&fit=crop",
    },
    {
      name: "Chelsea Boots",
      slug: "chelsea-boots",
      description: "Sleek leather Chelsea boots with elastic side panels and stacked heel.",
      price: 129.99,
      compare_at_price: 159.99,
      category_slug: "shoes",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
    },
    {
      name: "Running Sneakers",
      slug: "running-sneakers",
      description: "Lightweight mesh running shoes with responsive cushioning.",
      price: 89.99,
      category_slug: "shoes",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop",
    },
    {
      name: "Leather Loafers",
      slug: "leather-loafers",
      description: "Slip-on penny loafers in full-grain leather. Versatile and refined.",
      price: 109.99,
      category_slug: "shoes",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&h=500&fit=crop",
    },
    {
      name: "Strappy Sandals",
      slug: "strappy-sandals",
      description: "Minimalist strappy sandals with a cushioned footbed. Summer go-to.",
      price: 59.99,
      compare_at_price: 74.99,
      category_slug: "shoes",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&h=500&fit=crop",
    },

    // ── Accessories ────────────────────────────────────────────────────────
    {
      name: "Leather Belt",
      slug: "leather-belt",
      description: "Genuine leather belt with brushed nickel buckle.",
      price: 29.99,
      category_slug: "accessories",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
    },
    {
      name: "Canvas Tote Bag",
      slug: "canvas-tote-bag",
      description: "Sturdy heavyweight canvas tote with interior pocket and snap closure.",
      price: 34.99,
      category_slug: "accessories",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop",
    },
    {
      name: "Merino Wool Scarf",
      slug: "merino-wool-scarf",
      description: "Soft merino wool scarf in a generous length. Ideal for layering.",
      price: 39.99,
      category_slug: "accessories",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500&h=500&fit=crop",
    },
    {
      name: "Leather Wallet",
      slug: "leather-wallet",
      description: "Slim bifold wallet in full-grain leather with 6 card slots.",
      price: 49.99,
      compare_at_price: 64.99,
      category_slug: "accessories",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&h=500&fit=crop",
    },
    {
      name: "Sunglasses",
      slug: "sunglasses",
      description: "Polarized UV400 lenses in a classic acetate frame.",
      price: 79.99,
      category_slug: "accessories",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&h=500&fit=crop",
    },

    // ── Hats (extra) ───────────────────────────────────────────────────────
    {
      name: "Dad Hat",
      slug: "dad-hat",
      description: "Unstructured low-profile cap with a curved brim and brass buckle strap.",
      price: 22.99,
      category_slug: "hats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop",
    },
    {
      name: "Bucket Hat",
      slug: "bucket-hat",
      description: "Reversible bucket hat in durable cotton canvas. UV-protective brim.",
      price: 27.99,
      category_slug: "hats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=500&h=500&fit=crop",
    },
    {
      name: "Wool Fedora",
      slug: "wool-fedora",
      description: "Classic felt fedora with grosgrain ribbon band. Timeless style.",
      price: 44.99,
      compare_at_price: 54.99,
      category_slug: "hats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=500&h=500&fit=crop",
    },

    // ── T-Shirts (extra) ───────────────────────────────────────────────────
    {
      name: "Long-Sleeve Tee",
      slug: "long-sleeve-tee",
      description: "Slim-fit long-sleeve tee in soft jersey. Great for layering.",
      price: 27.99,
      category_slug: "t-shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&h=500&fit=crop",
    },
    {
      name: "Performance Tee",
      slug: "performance-tee",
      description: "Moisture-wicking performance tee with UPF 30 sun protection.",
      price: 34.99,
      category_slug: "t-shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&h=500&fit=crop",
    },
    {
      name: "Ribbed Tank Top",
      slug: "ribbed-tank-top",
      description: "Fitted ribbed-knit tank top. Versatile layering piece.",
      price: 18.99,
      category_slug: "t-shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop",
    },

    // ── Shirts (extra) ─────────────────────────────────────────────────────
    {
      name: "Denim Shirt",
      slug: "denim-shirt",
      description: "Lightweight denim shirt with chest pockets. Wear open as a jacket.",
      price: 54.99,
      category_slug: "shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=500&h=500&fit=crop",
    },
    {
      name: "Mandarin Collar Shirt",
      slug: "mandarin-collar-shirt",
      description: "Clean mandarin collar shirt in soft poplin. Modern minimalist look.",
      price: 59.99,
      category_slug: "shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=500&h=500&fit=crop",
    },
    {
      name: "Checked Overshirt",
      slug: "checked-overshirt",
      description: "Relaxed checked overshirt in brushed cotton. Layer over a tee.",
      price: 69.99,
      compare_at_price: 84.99,
      category_slug: "shirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1626497764746-6dc36546b388?w=500&h=500&fit=crop",
    },

    // ── Jackets & Coats (extra) ────────────────────────────────────────────
    {
      name: "Varsity Jacket",
      slug: "varsity-jacket",
      description: "Classic letterman jacket with ribbed trim and snap button closure.",
      price: 129.99,
      compare_at_price: 159.99,
      category_slug: "jackets-coats",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&h=500&fit=crop",
    },
    {
      name: "Windbreaker",
      slug: "windbreaker",
      description: "Packable windbreaker with DWR coating and hood. Lightweight protection.",
      price: 89.99,
      category_slug: "jackets-coats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=500&h=500&fit=crop",
    },
    {
      name: "Leather Jacket",
      slug: "leather-jacket",
      description: "Classic moto jacket in genuine lamb leather. Asymmetric zip closure.",
      price: 299.99,
      compare_at_price: 379.99,
      category_slug: "jackets-coats",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=500&h=500&fit=crop",
    },

    // ── Hoodies & Sweaters (extra) ─────────────────────────────────────────
    {
      name: "Quarter-Zip Sweatshirt",
      slug: "quarter-zip-sweatshirt",
      description: "Midweight quarter-zip in French terry. Clean, sporty look.",
      price: 64.99,
      category_slug: "hoodies-sweaters",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1609587312208-cea54be969e7?w=500&h=500&fit=crop",
    },
    {
      name: "Oversized Hoodie",
      slug: "oversized-hoodie",
      description: "Boxy oversized hoodie in ultra-soft fleece. Dropped shoulders.",
      price: 69.99,
      compare_at_price: 84.99,
      category_slug: "hoodies-sweaters",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=500&h=500&fit=crop",
    },
    {
      name: "Sherpa Fleece Jacket",
      slug: "sherpa-fleece-jacket",
      description: "Cozy sherpa fleece zip-up with contrast lining. Outdoor-ready.",
      price: 79.99,
      category_slug: "hoodies-sweaters",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=500&h=500&fit=crop",
    },

    // ── Pants (extra) ──────────────────────────────────────────────────────
    {
      name: "Linen Trousers",
      slug: "linen-trousers",
      description: "Relaxed linen trousers with an elasticated waist. Breathable.",
      price: 59.99,
      category_slug: "pants",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=500&h=500&fit=crop",
    },
    {
      name: "Wide-Leg Trousers",
      slug: "wide-leg-trousers",
      description: "High-rise wide-leg trousers in fluid crepe. Elegant drape.",
      price: 79.99,
      compare_at_price: 94.99,
      category_slug: "pants",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1547496502-affa22d38842?w=500&h=500&fit=crop",
    },
    {
      name: "Tech Joggers",
      slug: "tech-joggers",
      description: "Slim tech joggers with 4-way stretch and zip pockets.",
      price: 54.99,
      category_slug: "pants",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&h=500&fit=crop",
    },

    // ── Jeans (extra) ──────────────────────────────────────────────────────
    {
      name: "Bootcut Jeans",
      slug: "bootcut-jeans",
      description: "Classic bootcut jeans with a slight flare at the hem.",
      price: 72.99,
      category_slug: "jeans",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=500&h=500&fit=crop",
    },
    {
      name: "Flared Jeans",
      slug: "flared-jeans",
      description: "70s-inspired high-rise flare jeans in a medium indigo wash.",
      price: 84.99,
      compare_at_price: 99.99,
      category_slug: "jeans",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=500&h=500&fit=crop",
    },
    {
      name: "Mom Jeans",
      slug: "mom-jeans",
      description: "High-rise relaxed mom jeans with a tapered leg. Effortlessly cool.",
      price: 74.99,
      category_slug: "jeans",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1496347646636-ea47f7d6b37b?w=500&h=500&fit=crop",
    },

    // ── Shorts (extra) ─────────────────────────────────────────────────────
    {
      name: "Board Shorts",
      slug: "board-shorts",
      description: "Quick-dry board shorts with a side stripe and Velcro fly.",
      price: 42.99,
      category_slug: "shorts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?w=500&h=500&fit=crop",
    },
    {
      name: "Bike Shorts",
      slug: "bike-shorts",
      description: "High-waist stretch bike shorts with a brushed inner lining.",
      price: 32.99,
      category_slug: "shorts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=500&h=500&fit=crop",
    },
    {
      name: "Twill Cargo Shorts",
      slug: "twill-cargo-shorts",
      description: "Relaxed cargo shorts in durable cotton twill with zip pockets.",
      price: 47.99,
      category_slug: "shorts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1569396116180-210c182bedb8?w=500&h=500&fit=crop",
    },

    // ── Dresses (extra) ────────────────────────────────────────────────────
    {
      name: "Mini Dress",
      slug: "mini-dress",
      description: "Sleeveless mini dress in a stretchy ribbed fabric. Day-to-night.",
      price: 54.99,
      category_slug: "dresses",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=500&h=500&fit=crop",
    },
    {
      name: "Sundress",
      slug: "sundress",
      description: "Breezy sundress in lightweight voile with adjustable tie straps.",
      price: 64.99,
      compare_at_price: 79.99,
      category_slug: "dresses",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop",
    },
    {
      name: "Evening Gown",
      slug: "evening-gown",
      description: "Floor-length satin gown with a cowl neckline and open back.",
      price: 189.99,
      compare_at_price: 229.99,
      category_slug: "dresses",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&h=500&fit=crop",
    },

    // ── Skirts (extra) ─────────────────────────────────────────────────────
    {
      name: "Pencil Skirt",
      slug: "pencil-skirt",
      description: "Knee-length pencil skirt in a stretch ponte fabric. Office-ready.",
      price: 54.99,
      category_slug: "skirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=500&h=500&fit=crop",
    },
    {
      name: "Tiered Ruffle Skirt",
      slug: "tiered-ruffle-skirt",
      description: "Romantic tiered maxi skirt in flowy chiffon with a ruffled hem.",
      price: 69.99,
      compare_at_price: 84.99,
      category_slug: "skirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1588007375246-3ee823ef4851?w=500&h=500&fit=crop",
    },
    {
      name: "Mini Denim Skirt",
      slug: "mini-denim-skirt",
      description: "Classic mini skirt in rigid denim with front button placket.",
      price: 44.99,
      category_slug: "skirts",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&h=500&fit=crop",
    },

    // ── Shoes (extra) ──────────────────────────────────────────────────────
    {
      name: "Ankle Boots",
      slug: "ankle-boots",
      description: "Suede ankle boots with a block heel and side zip. Versatile and chic.",
      price: 119.99,
      compare_at_price: 144.99,
      category_slug: "shoes",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop",
    },
    {
      name: "Platform Sneakers",
      slug: "platform-sneakers",
      description: "Chunky platform sneakers with thick EVA sole. Bold street style.",
      price: 99.99,
      category_slug: "shoes",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop",
    },
    {
      name: "Oxford Shoes",
      slug: "oxford-shoes",
      description: "Classic cap-toe Oxfords in polished leather. Formal and versatile.",
      price: 139.99,
      compare_at_price: 169.99,
      category_slug: "shoes",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&h=500&fit=crop",
    },

    // ── Accessories (extra) ────────────────────────────────────────────────
    {
      name: "Crossbody Bag",
      slug: "crossbody-bag",
      description: "Compact crossbody bag in pebbled leather with adjustable strap.",
      price: 69.99,
      compare_at_price: 84.99,
      category_slug: "accessories",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=500&h=500&fit=crop",
    },
    {
      name: "Backpack",
      slug: "backpack",
      description: "15L daypack in waxed canvas with laptop sleeve and leather accents.",
      price: 89.99,
      category_slug: "accessories",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
    },
    {
      name: "Classic Watch",
      slug: "classic-watch",
      description: "Minimalist quartz watch with a mesh bracelet and sapphire crystal.",
      price: 149.99,
      compare_at_price: 179.99,
      category_slug: "accessories",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    },
  ];

  for (const p of products) {
    const [cat] = await db`SELECT id FROM categories WHERE slug = ${p.category_slug}`;
    await db`INSERT INTO products (name, slug, description, price, compare_at_price, category_id, featured, image_url)
      VALUES (${p.name}, ${p.slug}, ${p.description}, ${p.price}, ${p.compare_at_price ?? null}, ${cat.id}, ${!!p.featured}, ${p.image_url})`;
  }

  const allProducts = (await db`SELECT id, slug FROM products`) as { id: number; slug: string }[];
  const sizes = ["S", "M", "L", "XL"];
  const colors = ["Black", "White", "Navy"];

  for (const product of allProducts) {
    for (const size of sizes) {
      for (const color of colors) {
        const sku = `${product.slug}-${size}-${color}`.toLowerCase().replace(/\s+/g, "-");
        const stock = Math.floor(Math.random() * 20) + 5;
        await db`INSERT INTO product_variants (product_id, size, color, stock, sku)
          VALUES (${product.id}, ${size}, ${color}, ${stock}, ${sku})`;
      }
    }
  }

  await ensureAdmin();

  console.log("Database seeded successfully.");
}
