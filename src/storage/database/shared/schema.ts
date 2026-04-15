import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  index,
  varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const gameRecords = pgTable(
  "game_records",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    scenario: varchar("scenario", { length: 255 }).notNull(),
    final_score: integer("final_score").notNull(),
    result: varchar("result", { length: 32 }).notNull(),
    played_at: timestamp("played_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("game_records_user_id_idx").on(table.user_id),
    index("game_records_played_at_idx").on(table.played_at),
  ]
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("blog_posts_created_at_idx").on(table.created_at),
  ]
);

export type User = typeof users.$inferSelect;
export type GameRecord = typeof gameRecords.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
