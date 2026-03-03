import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "JIT Reporter",
  description:
    "Just-In-Time production order reporting for the MAST team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}}())`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <nav className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-8">
            <Link href="/" className="text-lg font-bold tracking-tight">
              JIT Reporter
            </Link>
            <div className="flex gap-6 text-sm">
              <Link
                href="/watches"
                className="hover:text-blue-300 transition-colors"
              >
                Watch List
              </Link>
              <Link
                href="/results"
                className="hover:text-blue-300 transition-colors"
              >
                Upcoming Production Orders
              </Link>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          {children}
        </main>

        <footer className="bg-gray-100 dark:bg-gray-900 text-gray-500 text-sm text-center py-4 border-t border-gray-200 dark:border-gray-800">
          JIT Reporter &mdash; MAST Team
        </footer>
      </body>
    </html>
  );
}
