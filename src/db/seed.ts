import { getDb, migrate } from "./schema.ts";

export async function seed() {
  const db = getDb();
  migrate();

  const existingCategories = db.query("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (existingCategories.count > 0) return;

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

  const insertCategory = db.prepare(
    "INSERT INTO categories (name, slug, description, sort_order, image_url) VALUES (?, ?, ?, ?, ?)",
  );

  for (const cat of categories) {
    insertCategory.run(cat.name, cat.slug, cat.description, cat.sort_order, cat.image_url);
  }

  const products = [
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
      name: "Essential Crew Tee",
      slug: "essential-crew-tee",
      description: "Soft cotton crew-neck tee, available in multiple colors.",
      price: 19.99,
      category_slug: "t-shirts",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    },
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
      name: "Pullover Hoodie",
      slug: "pullover-hoodie",
      description: "Heavyweight fleece hoodie with kangaroo pocket.",
      price: 54.99,
      category_slug: "hoodies-sweaters",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop",
    },
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
      name: "Straight Fit Jeans",
      slug: "straight-fit-jeans",
      description: "Classic straight-fit jeans in medium wash denim.",
      price: 69.99,
      category_slug: "jeans",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop",
    },
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
      name: "Wrap Midi Dress",
      slug: "wrap-midi-dress",
      description: "Flattering wrap silhouette in a versatile midi length.",
      price: 79.99,
      category_slug: "dresses",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop",
    },
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
      name: "Canvas Sneakers",
      slug: "canvas-sneakers",
      description: "Classic low-top canvas sneakers with vulcanized sole.",
      price: 44.99,
      category_slug: "shoes",
      featured: 1,
      image_url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=500&fit=crop",
    },
    {
      name: "Leather Belt",
      slug: "leather-belt",
      description: "Genuine leather belt with brushed nickel buckle.",
      price: 29.99,
      category_slug: "accessories",
      featured: 0,
      image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
    },
  ];

  const insertProduct = db.prepare(
    "INSERT INTO products (name, slug, description, price, compare_at_price, category_id, featured, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );

  const getCategoryId = db.prepare("SELECT id FROM categories WHERE slug = ?");

  for (const p of products) {
    const cat = getCategoryId.get(p.category_slug) as { id: number };
    insertProduct.run(
      p.name,
      p.slug,
      p.description,
      p.price,
      p.compare_at_price ?? null,
      cat.id,
      p.featured,
      p.image_url,
    );
  }

  const insertVariant = db.prepare(
    "INSERT INTO product_variants (product_id, size, color, stock, sku) VALUES (?, ?, ?, ?, ?)",
  );

  const allProducts = db.query("SELECT id, slug FROM products").all() as { id: number; slug: string }[];
  const sizes = ["S", "M", "L", "XL"];
  const colors = ["Black", "White", "Navy"];

  for (const product of allProducts) {
    for (const size of sizes) {
      for (const color of colors) {
        const sku = `${product.slug}-${size}-${color}`.toLowerCase().replace(/\s+/g, "-");
        const stock = Math.floor(Math.random() * 20) + 5;
        insertVariant.run(product.id, size, color, stock, sku);
      }
    }
  }

  const passwordHash = await Bun.password.hash("admin", { algorithm: "bcrypt" });
  db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run("admin", passwordHash);

  console.log("Database seeded successfully.");
}
