import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isGameEnabled } from "@/lib/game-limits";
import { getSettings } from "@/lib/settings";
import { wheelValues } from "@/lib/games";
import { Wheel } from "./Wheel";

export default async function WheelPage() {
  await requireUser();
  if (!(await isGameEnabled("WHEEL"))) redirect("/games");
  const { wheelMaxPoints } = await getSettings();
  return <div className="container-bp max-w-2xl py-8"><Wheel values={wheelValues(wheelMaxPoints)} /></div>;
}
