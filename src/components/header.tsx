import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/login/actions";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-green-100 bg-white/95 pt-safe backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex min-h-11 items-center gap-2 active:opacity-70">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
            priority
          />
          <span className="text-xl font-bold text-green-700">MGreen</span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm text-gray-500 active:bg-gray-100"
          >
            ログアウト
          </button>
        </form>
      </div>
    </header>
  );
}
