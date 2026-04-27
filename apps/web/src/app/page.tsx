import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Pilleus</h1>
      <Link href="/sign-in">
        <Button size="lg">Get Started</Button>
      </Link>
    </main>
  );
}
