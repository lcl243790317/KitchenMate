import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  real,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import type { Recipe } from "../model";
export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  email: text().notNull().unique(),
  createdAt: timestamp().defaultNow().notNull(),
});
export const ingredientTable = pgTable("ingredients", {
  id: text().primaryKey(),
  canonicalName: text().notNull().unique(),
  displayNameZh: text().notNull(),
  displayNameEn: text().notNull(),
  category: text().notNull(),
  pantryStaple: boolean().default(false).notNull(),
});
export const ingredientAliases = pgTable("ingredient_aliases", {
  alias: text().primaryKey(),
  ingredientId: text()
    .references(() => ingredientTable.id, { onDelete: "cascade" })
    .notNull(),
});
export const pantryItems = pgTable(
  "pantry_items",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    ingredientId: text()
      .references(() => ingredientTable.id)
      .notNull(),
    quantity: real(),
    unit: text(),
    expiryDate: timestamp(),
    storageLocation: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (t) => [uniqueIndex("pantry_user_ingredient").on(t.userId, t.ingredientId)],
);
export const recipes = pgTable(
  "recipes",
  {
    id: text().primaryKey(),
    sourceProvider: text().notNull(),
    externalId: text(),
    sourceUrl: text(),
    document: jsonb().$type<Recipe>().notNull(),
    lastFetchedAt: timestamp().defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("recipe_provider_external").on(t.sourceProvider, t.externalId),
    index("recipe_source_url").on(t.sourceUrl),
  ],
);
export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: uuid().defaultRandom().primaryKey(),
    recipeId: text()
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    ingredientId: text().references(() => ingredientTable.id),
    originalText: text().notNull(),
    quantity: real(),
    unit: text(),
    optional: boolean().default(false),
  },
  (t) => [index("recipe_ingredient_lookup").on(t.ingredientId)],
);
export const recipeInstructions = pgTable(
  "recipe_instructions",
  {
    id: uuid().defaultRandom().primaryKey(),
    recipeId: text()
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    stepNumber: integer().notNull(),
    description: text().notNull(),
    durationSeconds: integer(),
  },
  (t) => [uniqueIndex("recipe_step").on(t.recipeId, t.stepNumber)],
);
export const favorites = pgTable(
  "favorites",
  {
    userId: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    recipeId: text()
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [uniqueIndex("favorite_user_recipe").on(t.userId, t.recipeId)],
);
export const shoppingLists = pgTable("shopping_lists", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text().notNull(),
});
export const shoppingItems = pgTable("shopping_items", {
  id: uuid().defaultRandom().primaryKey(),
  listId: uuid()
    .references(() => shoppingLists.id, { onDelete: "cascade" })
    .notNull(),
  ingredientId: text().references(() => ingredientTable.id),
  name: text().notNull(),
  quantity: real(),
  unit: text(),
  checked: boolean().default(false),
});
export const recipeImports = pgTable(
  "recipe_imports",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    recipeId: text()
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    sourceUrl: text().notNull(),
    createdAt: timestamp().defaultNow(),
  },
  (t) => [uniqueIndex("import_user_url").on(t.userId, t.sourceUrl)],
);
