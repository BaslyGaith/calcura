import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Première barrière (rapide) : les pages protégées exigent une session valide.
// Le rôle et le statut (bloqué ou non) sont revérifiés en base par chaque page et
// chaque action serveur : un changement de rôle par l'admin prend donc effet sans reconnexion.
export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/merchant/:path*", "/me", "/games/:path+"] };
