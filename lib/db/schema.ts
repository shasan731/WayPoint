import { randomUUID } from "node:crypto";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid
} from "drizzle-orm/pg-core";

export type ConnectionStatus = "active" | "revoked" | "blocked";

const id = (name = "id") =>
  uuid(name)
    .primaryKey()
    .$defaultFn(() => randomUUID());

const timestamps = {
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull()
};

export const users = pgTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash"),
  emailVerified: timestamp("emailVerified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  globalGhostMode: boolean("globalGhostMode").default(false).notNull(),
  shareBattery: boolean("shareBattery").default(false).notNull(),
  allowLocationHistory: boolean("allowLocationHistory").default(false).notNull(),
  lastSeenAt: timestamp("lastSeenAt", { withTimezone: true, mode: "date" }),
  ...timestamps
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<"oauth" | "oidc" | "email">().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull()
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull()
  },
  (verificationToken) => ({
    compoundKey: primaryKey({ columns: [verificationToken.identifier, verificationToken.token] })
  })
);

export const locationCurrent = pgTable(
  "location_current",
  {
    userId: uuid("userId")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    accuracy: doublePrecision("accuracy"),
    altitude: doublePrecision("altitude"),
    heading: doublePrecision("heading"),
    speed: doublePrecision("speed"),
    batteryLevel: integer("batteryLevel"),
    isCharging: boolean("isCharging"),
    source: text("source").default("browser-geolocation").notNull(),
    lastUpdated: timestamp("lastUpdated", { withTimezone: true, mode: "date" }).defaultNow().notNull()
  },
  (location) => ({
    lastUpdatedIdx: index("location_current_last_updated_idx").on(location.lastUpdated)
  })
);

export const locationHistory = pgTable(
  "location_history",
  {
    id: id(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    accuracy: doublePrecision("accuracy"),
    batteryLevel: integer("batteryLevel"),
    recordedAt: timestamp("recordedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull()
  },
  (history) => ({
    userIdx: index("location_history_user_idx").on(history.userId),
    recordedAtIdx: index("location_history_recorded_at_idx").on(history.recordedAt),
    userRecordedAtIdx: index("location_history_user_recorded_at_idx").on(history.userId, history.recordedAt)
  })
);

export const accessKeys = pgTable(
  "access_keys",
  {
    id: id(),
    ownerId: uuid("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyLabel: text("keyLabel").notNull(),
    tokenHash: text("tokenHash").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    isMuted: boolean("isMuted").default(false).notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" }),
    lastUsedAt: timestamp("lastUsedAt", { withTimezone: true, mode: "date" }),
    ...timestamps
  },
  (key) => ({
    ownerIdx: index("access_keys_owner_idx").on(key.ownerId),
    tokenHashUnique: unique("access_keys_token_hash_unique").on(key.tokenHash),
    ownerActiveIdx: index("access_keys_owner_active_idx").on(key.ownerId, key.isActive)
  })
);

export const connections = pgTable(
  "connections",
  {
    id: id(),
    followerId: uuid("followerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ownerId: uuid("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessKeyId: uuid("accessKeyId")
      .notNull()
      .references(() => accessKeys.id, { onDelete: "cascade" }),
    status: text("status").$type<ConnectionStatus>().default("active").notNull(),
    grantedAt: timestamp("grantedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    revokedAt: timestamp("revokedAt", { withTimezone: true, mode: "date" })
  },
  (connection) => ({
    followerAccessKeyUnique: unique("connections_follower_access_key_unique").on(
      connection.followerId,
      connection.accessKeyId
    ),
    followerIdx: index("connections_follower_idx").on(connection.followerId),
    ownerIdx: index("connections_owner_idx").on(connection.ownerId),
    accessKeyIdx: index("connections_access_key_idx").on(connection.accessKeyId),
    followerStatusIdx: index("connections_follower_status_idx").on(connection.followerId, connection.status)
  })
);
