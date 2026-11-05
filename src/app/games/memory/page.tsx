import { requireUser } from "@/lib/auth";
import { Memory } from "./Memory";

export default async function MemoryPage() {
  await requireUser();
  return <div className="container-bp max-w-2xl py-8"><Memory /></div>;
}
