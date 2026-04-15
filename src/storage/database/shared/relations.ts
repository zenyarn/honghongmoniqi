import { relations } from "drizzle-orm/relations";
import { gameRecords, users } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  gameRecords: many(gameRecords),
}));

export const gameRecordsRelations = relations(gameRecords, ({ one }) => ({
  user: one(users, {
    fields: [gameRecords.user_id],
    references: [users.id],
  }),
}));
