// Bloque/débloque les établissements selon l'état des abonnements.
// Usage : npm run subscriptions:enforce (à planifier quotidiennement).
import { enforceSubscriptions } from "../src/lib/subscriptions";
import { runDueDraws } from "../src/lib/draws";
import { prisma } from "../src/lib/db";

enforceSubscriptions()
  .then(async (r) => console.log(`Bloqués : ${r.blocked} — Débloqués : ${r.unblocked} — Tirages effectués : ${await runDueDraws()}`))
  .finally(() => prisma.$disconnect());
