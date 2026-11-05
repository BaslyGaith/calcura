/**
 * Données initiales : 24 gouvernorats, paramètres, comptes de démonstration et
 * établissements de démonstration (clairement marqués « Démo »).
 * Pour les vrais cafés et restaurants, lancez ensuite : npm run import:osm
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GOVERNORATES } from "../src/lib/governorates";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { enforceSubscriptions } from "../src/lib/subscriptions";

const prisma = new PrismaClient();

const CAFE_NAMES = ["Café des Jasmins", "Café El Medina", "Café La Corniche", "Salon de thé Yasmine", "Café Les Palmiers", "Café du Port"];
const RESTO_NAMES = ["Restaurant Dar El Bey", "Le Grill Tunisien", "Pizzeria Carthage", "Restaurant El Khima", "Le Poisson d'Or", "Chez Hamadi"];
const CAFE_MENU = [
  ["Boissons chaudes", "Express", 1.8], ["Boissons chaudes", "Capucin", 2.2], ["Boissons chaudes", "Café crème", 2.5],
  ["Boissons chaudes", "Thé à la menthe", 2.0], ["Boissons chaudes", "Thé aux pignons", 3.5],
  ["Boissons fraîches", "Citronnade", 3.0], ["Boissons fraîches", "Jus d'orange pressé", 4.0], ["Boissons fraîches", "Eau minérale", 1.2],
  ["Petit-déjeuner", "Croissant", 1.5], ["Petit-déjeuner", "Bambalouni", 1.2], ["Petit-déjeuner", "Formule petit-déjeuner", 7.5],
  ["Desserts", "Bouza", 3.0], ["Desserts", "Makroudh", 1.5],
] as const;
const RESTO_MENU = [
  ["Entrées", "Brik à l'œuf", 3.5], ["Entrées", "Salade méchouia", 6.0], ["Entrées", "Chorba frik", 5.0], ["Entrées", "Lablabi", 4.5],
  ["Plats", "Couscous à l'agneau", 18.0], ["Plats", "Ojja merguez", 12.0], ["Plats", "Kamounia", 15.0], ["Plats", "Poisson grillé du jour", 25.0], ["Plats", "Kafteji", 7.0],
  ["Pizzas", "Pizza margherita", 9.0], ["Pizzas", "Pizza neptune", 12.0],
  ["Desserts", "Assida", 4.0], ["Desserts", "Zrir", 4.5],
] as const;
// Photos de plats de démonstration (public/demo/dishes) — utilisées dans le menu et le puzzle.
const DISH_IMAGES: Record<string, string> = {
  "Express": "express", "Capucin": "capucin", "Café crème": "cafe-creme", "Thé à la menthe": "the-menthe", "Thé aux pignons": "the-pignons",
  "Citronnade": "citronnade", "Jus d'orange pressé": "jus-orange", "Eau minérale": "eau", "Croissant": "croissant", "Bambalouni": "bambalouni",
  "Formule petit-déjeuner": "petit-dej", "Bouza": "bouza", "Makroudh": "makroudh", "Brik à l'œuf": "brik", "Salade méchouia": "mechouia",
  "Chorba frik": "chorba", "Lablabi": "lablabi", "Couscous à l'agneau": "couscous", "Ojja merguez": "ojja", "Kamounia": "kamounia",
  "Poisson grillé du jour": "poisson", "Kafteji": "kafteji", "Pizza margherita": "pizza-margherita", "Pizza neptune": "pizza-neptune",
  "Assida": "assida", "Zrir": "zrir",
};
const dishImage = (name: string) => (DISH_IMAGES[name] ? `/demo/dishes/${DISH_IMAGES[name]}.svg` : null);

const FEATURE_SETS = ["wifi,terrasse", "wifi,climatisation,famille", "terrasse,vue_mer", "parking,famille,livraison", "wifi,match,terrasse", "non_fumeur,climatisation"];

const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];
const jitter = (seed: number) => (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.04;

async function main() {
  // Gouvernorats
  for (const g of GOVERNORATES) {
    await prisma.governorate.upsert({ where: { code: g.code }, update: g, create: g });
  }
  const govs = await prisma.governorate.findMany({ orderBy: { code: "asc" } });

  // Paramètres par défaut (sans écraser ceux déjà modifiés par l'admin)
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value: String(value) } });
  }

  // Comptes
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@bonplan.tn").toLowerCase();
  const adminPw = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const demoPw = await bcrypt.hash("Demo1234!", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: { email: adminEmail, name: "Administrateur", passwordHash: await bcrypt.hash(adminPw, 10), role: "ADMIN", referralCode: "ADMIN0001" },
  });
  const merchant = await prisma.user.upsert({
    where: { email: "commercant@bonplan.tn" },
    update: {},
    create: { email: "commercant@bonplan.tn", name: "Sami Commerçant", phone: "+216 71 000 000", passwordHash: demoPw, role: "MERCHANT", referralCode: "SAMI0001" },
  });
  const unpaid = await prisma.user.upsert({
    where: { email: "impaye@bonplan.tn" },
    update: {},
    create: { email: "impaye@bonplan.tn", name: "Leila Impayé", passwordHash: demoPw, role: "MERCHANT", referralCode: "LEIL0001" },
  });
  const user = await prisma.user.upsert({
    where: { email: "user@bonplan.tn" },
    update: {},
    create: { email: "user@bonplan.tn", name: "Amine Utilisateur", passwordHash: demoPw, role: "USER", points: 250, referralCode: "AMIN0001" },
  });
  if ((await prisma.pointTransaction.count({ where: { userId: user.id } })) === 0) {
    await prisma.pointTransaction.create({ data: { userId: user.id, amount: 250, reason: "SIGNUP", detail: "Démo" } });
  }

  // Abonnements : Sami a payé, Leila non.
  await prisma.subscription.deleteMany({ where: { merchantId: { in: [merchant.id, unpaid.id] } } });
  const now = new Date();
  const inAYear = new Date(now); inAYear.setFullYear(now.getFullYear() + 1);
  const lastMonth = new Date(now); lastMonth.setMonth(now.getMonth() - 2);
  const expired = new Date(now); expired.setMonth(now.getMonth() - 1);
  await prisma.subscription.create({ data: { merchantId: merchant.id, plan: "YEARLY", amountTnd: DEFAULT_SETTINGS.subscriptionYearly, startsAt: now, endsAt: inAYear, status: "PAID", paidAt: now } });
  await prisma.subscription.create({ data: { merchantId: unpaid.id, plan: "MONTHLY", amountTnd: DEFAULT_SETTINGS.subscriptionMonthly, startsAt: lastMonth, endsAt: expired, status: "UNPAID" } });

  // Établissements de démo : on repart de zéro pour ceux-ci uniquement.
  await prisma.venue.deleteMany({ where: { OR: [{ source: "DEMO" }, { ownerId: { in: [merchant.id, unpaid.id] } }] } });

  let i = 0;
  const created: string[] = [];
  for (const g of govs) {
    for (const type of ["CAFE", "CAFE", "RESTAURANT", "RESTAURANT"] as const) {
      i++;
      const isCafe = type === "CAFE";
      const name = `${pick(isCafe ? CAFE_NAMES : RESTO_NAMES, i + g.code.length)} — ${g.nameFr}`;
      const img = isCafe ? `/demo/cafe-${(i % 4) + 1}.svg` : `/demo/resto-${(i % 4) + 1}.svg`;
      const menu = isCafe ? CAFE_MENU : RESTO_MENU;
      const v = await prisma.venue.create({
        data: {
          name, type, source: "DEMO", status: "ACTIVE",
          description: isCafe
            ? "Établissement de démonstration : café convivial, idéal pour un express ou un thé aux pignons."
            : "Établissement de démonstration : cuisine tunisienne traditionnelle et grillades.",
          cuisine: isCafe ? "café, salon de thé" : pick(["tunisienne", "grillades", "pizza", "poisson"], i),
          city: g.nameFr, address: `Avenue Habib Bourguiba, ${g.nameFr}`,
          openingHours: isCafe ? "06:00-23:00" : "12:00-15:00, 19:00-23:30",
          priceLevel: (i % 3) + 1,
          lat: g.lat + jitter(i), lng: g.lng + jitter(i * 7),
          coverImage: img,
          features: pick(FEATURE_SETS, i),
          featured: i % 9 === 0,
          governorateId: g.id,
          photos: {
            create: [
              { url: img, kind: "PLACE", caption: "Salle principale" },
              { url: isCafe ? `/demo/cafe-${((i + 1) % 4) + 1}.svg` : `/demo/resto-${((i + 1) % 4) + 1}.svg`, kind: "PLACE", caption: "Terrasse" },
              { url: isCafe ? "/demo/menu-cafe.svg" : i % 2 ? "/demo/menu-resto.svg" : "/demo/menu-pizza.svg", kind: "MENU", caption: "Carte" },
            ],
          },
          menuItems: { create: menu.map(([category, n, price]) => ({ category, name: n, price: Number((price * (1 + (i % 3) * 0.1)).toFixed(3)), imageUrl: dishImage(n) })) },
        },
      });
      created.push(v.id);
    }
  }

  // Établissements des commerçants de démo, avec bons d'achat.
  const tunis = govs.find((g) => g.slug === "tunis")!;
  const sousse = govs.find((g) => g.slug === "sousse")!;
  const owned = [
    { owner: merchant.id, gov: tunis, name: "Café Bon Plan Lac", type: "CAFE", img: "/demo/cafe-1.svg", menu: CAFE_MENU, lat: 36.8349, lng: 10.2340 },
    { owner: merchant.id, gov: tunis, name: "Restaurant Bon Plan Marsa", type: "RESTAURANT", img: "/demo/resto-1.svg", menu: RESTO_MENU, lat: 36.8782, lng: 10.3247 },
    { owner: merchant.id, gov: sousse, name: "Café Bon Plan Sousse", type: "CAFE", img: "/demo/cafe-4.svg", menu: CAFE_MENU, lat: 35.8288, lng: 10.6405 },
    { owner: unpaid.id, gov: tunis, name: "Pizzeria Impayée (démo blocage)", type: "RESTAURANT", img: "/demo/resto-3.svg", menu: RESTO_MENU, lat: 36.8003, lng: 10.1797 },
  ] as const;
  for (const [k, o] of owned.entries()) {
    const v = await prisma.venue.create({
      data: {
        name: o.name, type: o.type, source: "MERCHANT", ownerId: o.owner, status: "ACTIVE", featured: k < 2,
        description: "Établissement de démonstration géré par un commerçant.",
        city: o.gov.nameFr, address: "Centre-ville", openingHours: "07:00-23:00", priceLevel: 2,
        lat: o.lat, lng: o.lng, coverImage: o.img, features: "wifi,terrasse,climatisation", phone: "+216 71 000 000",
        governorateId: o.gov.id,
        photos: { create: [{ url: o.img, kind: "PLACE", caption: "Façade" }, { url: o.type === "CAFE" ? "/demo/menu-cafe.svg" : "/demo/menu-pizza.svg", kind: "MENU", caption: "Menu" }] },
        menuItems: { create: o.menu.map(([category, n, price]) => ({ category, name: n, price, imageUrl: dishImage(n) })) },
        offers: {
          create: [
            { title: o.type === "CAFE" ? "Un express offert" : "Un dessert offert", description: "Valable sur place, une fois par visite.", pointsCost: 60, valueTnd: 2, stock: 100 },
            { title: "-20 % sur l'addition", description: "Hors boissons alcoolisées et promotions.", pointsCost: 200, valueTnd: 10, stock: 30 },
          ],
        },
      },
    });
    created.push(v.id);
  }

  // Tirage au sort de démonstration : un repas offert par un commerçant abonné.
  await prisma.draw.deleteMany({ where: { description: { startsWith: "[Démo]" } } });
  const marsa = await prisma.venue.findFirst({ where: { name: "Restaurant Bon Plan Marsa" } });
  const drawEnd = new Date(now.getTime() + 30 * 86400000);
  await prisma.draw.create({
    data: {
      title: "Grand tirage du mois", prize: "Un repas pour 2 personnes", prizeValueTnd: 80,
      description: "[Démo] Terminez des puzzles pour gagner des tickets. Tirage automatique à la date de fin.",
      venueId: marsa?.id, ticketCostPoints: 50, maxTicketsPerUser: 50, startsAt: now, endsAt: drawEnd,
    },
  });

  // Quelques avis de démonstration
  for (const [k, id] of created.slice(0, 40).entries()) {
    await prisma.review.create({ data: { userId: user.id, venueId: id, rating: (k % 3) + 3, comment: k % 2 ? "Très bon accueil, je recommande !" : "Bon rapport qualité-prix." } });
  }

  // Le commerçant impayé voit ses établissements bloqués automatiquement.
  const r = await enforceSubscriptions();
  console.log(`Seed terminé : ${govs.length} gouvernorats, ${created.length} établissements de démo, admin = ${admin.email}. Blocages : ${r.blocked}.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
