import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-bp py-20 text-center">
      <div className="text-6xl">🍽️</div>
      <h1 className="h1 mt-4">404</h1>
      <Link href="/" className="btn-primary mt-6">Bon Plan</Link>
    </div>
  );
}
