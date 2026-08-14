import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  stopOrder: integer("stop_order").notNull(),
});

export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    locationId: text("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull().unique(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_photos_location_sort").on(table.locationId, table.sortOrder)],
);

export const nextStopPhotos = sqliteTable(
  "next_stop_photos",
  {
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull().unique(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_next_stop_photos_sort").on(table.sortOrder)],
);
