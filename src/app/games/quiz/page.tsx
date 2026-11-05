import { requireUser } from "@/lib/auth";
import { Quiz } from "./Quiz";

export default async function QuizPage() {
  await requireUser();
  return <div className="container-bp max-w-2xl py-8"><Quiz /></div>;
}
