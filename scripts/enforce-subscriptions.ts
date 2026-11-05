// Bloque/débloque les établissements selon l'état des abonnements.
// Usage : npm run subscriptions:enforce (à planifier quotidiennement).
import { enforceSubscriptions } from "../src/lib/subscriptions";
import { prisma } from "../src/lib/db";

enforceSubscriptions()
  .then((r) => console.log(`Bloqués : ${r.blocked} — Débloqués : ${r.unblocked}`))
  .finally(() => prisma.$disconnect());
