CREATE TABLE "visitor_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner" text NOT NULL,
	"kind" text NOT NULL,
	"view" text NOT NULL,
	"value" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "visitor_library_owner_kind" ON "visitor_library" ("owner","kind");