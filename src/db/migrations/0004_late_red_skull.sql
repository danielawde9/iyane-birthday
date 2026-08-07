ALTER TABLE "guestbook" ADD COLUMN "edit_token_hash" text;--> statement-breakpoint
ALTER TABLE "guestbook" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "edit_token_hash" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "guestbook" ADD CONSTRAINT "guestbook_status_check" CHECK ("guestbook"."status" in ('visible','hidden','removed'));--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_status_check" CHECK ("photos"."status" in ('visible','hidden','removed'));