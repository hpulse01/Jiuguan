import Link from "next/link";
import { Beer } from "lucide-react";

const footerLinks = [
  { href: "/about", label: "关于酒馆" },
  { href: "/terms", label: "使用条款" },
  { href: "/privacy", label: "隐私政策" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Beer className="h-5 w-5 text-warm-500" strokeWidth={1.8} />
              <span className="text-lg font-bold text-tavern-100">酒馆</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
              别人都在教你成功，酒馆告诉你如何避开失败
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-tavern-800" />
            <span className="h-1 w-1 rounded-full bg-tavern-700" />
            <span className="h-px w-12 bg-tavern-800" />
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-tavern-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-tavern-700">
            &copy; {currentYear} 酒馆. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  );
}
