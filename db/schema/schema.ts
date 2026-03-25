import { user } from "./auth-schema";
import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const links = pgTable("links", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  clicks: integer("clicks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("links_userId_idx").on(table.userId),
  index("links_createdAt_idx").on(table.createdAt),
]);

export const linkRelations = relations(links, ({ one }) => ({
  user: one(user, {
    fields: [links.userId],
    references: [user.id],
  }),
}));
