"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth";

const adminLinks = [
  { href: "/dashboard", label: "Ringkasan", icon: "◆" },
  { href: "/dashboard/presensi", label: "Presensi", icon: "▣" },
  { href: "/dashboard/laporan", label: "Laporan", icon: "▤" },
  { href: "/dashboard/siswa", label: "Siswa", icon: "◫" },
  { href: "/dashboard/kartu", label: "Kartu QR", icon: "▥" },
  { href: "/dashboard/kelas", label: "Kelas & Mapel", icon: "▦" },
  { href: "/dashboard/guru", label: "Akun Guru", icon: "◈" },
];

const guruLinks = [
  { href: "/dashboard", label: "Ringkasan", icon: "◆" },
  { href: "/dashboard/presensi", label: "Presensi", icon: "▣" },
  { href: "/dashboard/laporan", label: "Laporan", icon: "▤" },
];

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = profile.role === "admin" ? adminLinks : guruLinks;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="no-print flex flex-col w-64 shrink-0 bg-ink-950 text-chalk-50 min-h-screen">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="font-mono text-[11px] tracking-[0.25em] text-amber-400">
          PRESENSI
        </span>
        <p className="font-display text-lg font-semibold mt-1">Dasbor Sekolah</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors focus-ring ${
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-chalk-100/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-amber-400 w-4 text-center text-[13px]">
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-white/10">
        <p className="text-sm font-medium truncate">{profile.full_name}</p>
        <p className="text-xs text-chalk-100/50 truncate">
          {profile.role === "admin" ? "Admin" : "Guru"} · {profile.email}
        </p>
        <button
          onClick={handleLogout}
          className="mt-3 text-xs font-medium text-amber-400 hover:text-amber-300 focus-ring"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
