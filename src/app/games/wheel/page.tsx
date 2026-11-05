import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { wheelValues } from "@/lib/games";
import { Wheel } from "./Wheel";

export default async function WheelPage() {
  await requireUser();
  const { wheelMaxPoints } = await getSettings();
  return <div className="container-bp max-w-2xl py-8"><Wheel values={wheelValues(wheelMaxPoints)} /></div>;
}
