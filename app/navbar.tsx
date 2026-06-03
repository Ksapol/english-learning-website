import Link from "next/link";
import { AuthButton } from "@/app/components/AuthButton";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/review", label: "Review" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/progress", label: "Progress" },
  { href: "/lessons", label: "Lessons" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-slate-950 transition hover:text-emerald-700"
        >
          Thai English Starter
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {link.label}
            </Link>
          ))}
          <AuthButton />
        </div>
      </nav>
    </header>
  );
}
