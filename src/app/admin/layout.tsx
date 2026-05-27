import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin · Iyane — Year One", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg">{children}</div>;
}
