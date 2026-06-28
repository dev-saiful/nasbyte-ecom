import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear all existing users
  await prisma.user.deleteMany();
  console.log("Cleared all users");

  const adminPassword = await bcrypt.hash("password", 12);
  const userPassword = await bcrypt.hash("password", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Normal User",
      email: "user@example.com",
      password: userPassword,
      role: UserRole.USER,
      isVerified: true,
    },
  });

  console.log("Created users:", admin.email, user.email);

  const categories = [
    {
      name: "Scarves",
      slug: "scarves",
      description: "Elegant scarves for every occasion",
    },
    {
      name: "Bags",
      slug: "bags",
      description: "Stylish bags for everyday use",
    },
    {
      name: "Jewelry",
      slug: "jewelry",
      description: "Beautiful jewelry pieces",
    },
    {
      name: "Shoes",
      slug: "shoes",
      description: "Comfortable and fashionable footwear",
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Essential accessories to complete your look",
    },
  ];

  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      }),
    ),
  );

  console.log(
    "Created categories:",
    createdCategories.map((c) => c.name).join(", "),
  );

  const products = [
    {
      name: "Silk Pashmina Scarf",
      slug: "silk-pashmina-scarf",
      price: 1200,
      categoryId: createdCategories[0].id,
      description: "Luxurious silk pashmina scarf with intricate patterns",
      stock: 25,
    },
    {
      name: "Cashmere Winter Scarf",
      slug: "cashmere-winter-scarf",
      price: 1800,
      categoryId: createdCategories[0].id,
      description: "Soft cashmere scarf perfect for cold weather",
      stock: 15,
    },
    {
      name: "Canvas Tote Bag",
      slug: "canvas-tote-bag",
      price: 850,
      categoryId: createdCategories[1].id,
      description: "Durable canvas tote bag with spacious interior",
      stock: 40,
    },
    {
      name: "Leather Crossbody Bag",
      slug: "leather-crossbody-bag",
      price: 2500,
      categoryId: createdCategories[1].id,
      description: "Premium leather crossbody bag with adjustable strap",
      stock: 20,
    },
    {
      name: "Pearl Drop Earrings",
      slug: "pearl-drop-earrings",
      price: 1500,
      categoryId: createdCategories[2].id,
      description: "Elegant pearl drop earrings with gold plating",
      stock: 30,
    },
    {
      name: "Gold Chain Necklace",
      slug: "gold-chain-necklace",
      price: 3200,
      categoryId: createdCategories[2].id,
      description: "18k gold-plated chain necklace",
      stock: 10,
    },
    {
      name: "Embroidered Flat Sandals",
      slug: "embroidered-flat-sandals",
      price: 950,
      categoryId: createdCategories[3].id,
      description: "Hand-embroidered flat sandals with leather sole",
      stock: 35,
    },
    {
      name: "Suede Ankle Boots",
      slug: "suede-ankle-boots",
      price: 2800,
      categoryId: createdCategories[3].id,
      description: "Comfortable suede ankle boots with side zip",
      stock: 18,
    },
    {
      name: "Leather Belt",
      slug: "leather-belt",
      price: 650,
      categoryId: createdCategories[4].id,
      description: "Genuine leather belt with brass buckle",
      stock: 50,
    },
    {
      name: "Silk Pocket Square",
      slug: "silk-pocket-square",
      price: 450,
      categoryId: createdCategories[4].id,
      description: "Hand-finished silk pocket square",
      stock: 60,
    },
    {
      name: "Woven Straw Hat",
      slug: "woven-straw-hat",
      price: 750,
      categoryId: createdCategories[4].id,
      description: "Lightweight woven straw hat with ribbon band",
      stock: 45,
    },
    {
      name: "Beaded Bracelet",
      slug: "beaded-bracelet",
      price: 380,
      categoryId: createdCategories[2].id,
      description: "Handcrafted beaded bracelet with elastic cord",
      stock: 55,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: product.categoryId,
        isFeatured: Math.random() > 0.7,
        minPrice: product.price,
        variants: {
          create: {
            price: product.price,
            stock: product.stock,
            isDefault: true,
            isActive: true,
          },
        },
      },
    });
    createdProducts.push(created);
  }

  console.log("Created products:", createdProducts.length);

  await prisma.storefrontAnnouncement.deleteMany();
  await prisma.storefrontAnnouncement.create({
    data: {
      title: "Free shipping on orders over 5000 BDT!",
      isActive: true,
    },
  });

  console.log("Created storefront announcement");
  console.log("Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
