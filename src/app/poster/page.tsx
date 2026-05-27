import type { Metadata } from "next";
import { QrPoster } from "@/components/poster/QrPoster";

export const metadata: Metadata = { title: "Add your photos · Iyane — Year One" };

export default function PosterPage() {
  return <QrPoster />;
}
