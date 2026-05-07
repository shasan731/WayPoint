CREATE TABLE "access_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ownerId" uuid NOT NULL,
	"keyLabel" text NOT NULL,
	"tokenHash" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isMuted" boolean DEFAULT false NOT NULL,
	"expiresAt" timestamp with time zone,
	"lastUsedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_keys_token_hash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"followerId" uuid NOT NULL,
	"ownerId" uuid NOT NULL,
	"accessKeyId" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"grantedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"revokedAt" timestamp with time zone,
	CONSTRAINT "connections_follower_access_key_unique" UNIQUE("followerId","accessKeyId")
);
--> statement-breakpoint
CREATE TABLE "location_current" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"accuracy" double precision,
	"altitude" double precision,
	"heading" double precision,
	"speed" double precision,
	"batteryLevel" integer,
	"isCharging" boolean,
	"source" text DEFAULT 'browser-geolocation' NOT NULL,
	"lastUpdated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"accuracy" double precision,
	"batteryLevel" integer,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"globalGhostMode" boolean DEFAULT false NOT NULL,
	"shareBattery" boolean DEFAULT false NOT NULL,
	"allowLocationHistory" boolean DEFAULT false NOT NULL,
	"lastSeenAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_followerId_users_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_accessKeyId_access_keys_id_fk" FOREIGN KEY ("accessKeyId") REFERENCES "public"."access_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_current" ADD CONSTRAINT "location_current_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_keys_owner_idx" ON "access_keys" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "access_keys_owner_active_idx" ON "access_keys" USING btree ("ownerId","isActive");--> statement-breakpoint
CREATE INDEX "connections_follower_idx" ON "connections" USING btree ("followerId");--> statement-breakpoint
CREATE INDEX "connections_owner_idx" ON "connections" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "connections_access_key_idx" ON "connections" USING btree ("accessKeyId");--> statement-breakpoint
CREATE INDEX "connections_follower_status_idx" ON "connections" USING btree ("followerId","status");--> statement-breakpoint
CREATE INDEX "location_current_last_updated_idx" ON "location_current" USING btree ("lastUpdated");--> statement-breakpoint
CREATE INDEX "location_history_user_idx" ON "location_history" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "location_history_recorded_at_idx" ON "location_history" USING btree ("recordedAt");--> statement-breakpoint
CREATE INDEX "location_history_user_recorded_at_idx" ON "location_history" USING btree ("userId","recordedAt");