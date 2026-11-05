import { NextResponse } from "next/server";
import { enforceSubscriptions } from "@/lib/subscriptions";
import { runDueDraws } from "@/lib/draws";

// Contrôle des abonnements + tirages au sort arrivés à échéance.
// À appeler chaque jour par un planificateur (cron) :
//   curl -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine/api/cron/subscriptions
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await enforceSubscriptions();
  const drawsDone = await runDueDraws();
  return NextResponse.json({ ...result, drawsDone });
}
