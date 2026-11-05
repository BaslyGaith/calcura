import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isGameEnabled } from "@/lib/game-limits";
import { Memory } from "./Memory";

export default async function MemoryPage() {
  await requireUser();
  if (!(await isGameEnabled("MEMORY"))) redirect("/games");
  return <div className="container-bp max-w-2xl py-8"><Memory /></div>;
}
