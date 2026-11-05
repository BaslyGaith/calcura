import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isGameEnabled } from "@/lib/game-limits";
import { Puzzle } from "./Puzzle";

export default async function PuzzlePage() {
  await requireUser();
  if (!(await isGameEnabled("PUZZLE"))) redirect("/games");
  return <div className="container-bp max-w-2xl py-8"><Puzzle /></div>;
}
