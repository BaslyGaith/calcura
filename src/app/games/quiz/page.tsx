import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isGameEnabled } from "@/lib/game-limits";
import { Quiz } from "./Quiz";

export default async function QuizPage() {
  await requireUser();
  if (!(await isGameEnabled("QUIZ"))) redirect("/games");
  return <div className="container-bp max-w-2xl py-8"><Quiz /></div>;
}
