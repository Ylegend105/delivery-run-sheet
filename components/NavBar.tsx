import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { SignOutButton } from "./SignOutButton";

export async function NavBar() {
  const session = await getSession();
  if (!session) return null;

  const homeHref = session.role === "dispatcher" ? "/dispatcher" : "/driver";

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={homeHref} className="text-sm font-semibold text-gray-900">
          Delivery Run Sheet
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/settings" className="text-sm text-gray-500 hover:text-blue-600">
            Settings
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
