"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function AreaIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 ${active ? "text-green-700" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={active ? 2.5 : 2}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.468.732-3.553"
      />
    </svg>
  );
}

const isAreaSection = (path: string) =>
  path === "/" ||
  path.startsWith("/areas") ||
  path.startsWith("/plants");

export function BottomNav() {
  const pathname = usePathname();
  const active = isAreaSection(pathname);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-green-100 bg-white/95 backdrop-blur-md md:hidden"
      aria-label="メインナビゲーション"
    >
      <div className="mx-auto max-w-3xl pb-safe">
        <Link
          href="/"
          className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 transition active:bg-green-50 ${
            active ? "text-green-700" : "text-gray-500"
          }`}
        >
          <AreaIcon active={active} />
          <span
            className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}
          >
            エリア
          </span>
        </Link>
      </div>
    </nav>
  );
}
