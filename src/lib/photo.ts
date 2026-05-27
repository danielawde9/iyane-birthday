import type { PhotoRow } from "@/db/schema";
import { toPublicUrl } from "./storage";

/** Serialized photo sent to the client (resolved URLs, ISO date). */
export interface PhotoDTO {
  id: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption: string | null;
  uploaderName: string | null;
  createdAt: string;
}

export function toPhotoDTO(p: PhotoRow): PhotoDTO {
  return {
    id: p.id,
    url: toPublicUrl(p.storageKey),
    thumbUrl: toPublicUrl(p.thumbKey),
    width: p.width,
    height: p.height,
    caption: p.caption,
    uploaderName: p.uploaderName,
    createdAt: p.createdAt.toISOString(),
  };
}
