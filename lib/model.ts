import { z } from "zod";
export const recipeIngredientSchema = z.object({
  ingredientId: z.string(),
  originalText: z.string().max(500),
  quantity: z.number().nonnegative().nullable(),
  unit: z.string(),
  optional: z.boolean().default(false),
  group: z.string().default("主料"),
});
export const instructionSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().max(200),
  description: z.string().max(10000),
  durationSeconds: z.number().nonnegative().nullable(),
  image: z.string().nullable().default(null),
  tips: z.string().default(""),
  temperature: z.string().nullable().default(null),
});
export const provenanceSchema = z.object({
  type: z.enum([
    "FULL_VERIFIED",
    "SOURCE_LINKED",
    "USER_IMPORTED",
    "LICENSED_API",
    "OPEN_LICENSE",
    "FIRST_PARTY_TEST",
    "UNVERIFIED",
  ]),
  sourceName: z.string(),
  sourceUrl: z.string().url().nullable(),
  sourceRecipeTitle: z.string(),
  sourceAuthor: z.string().nullable(),
  sourceExternalId: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  verificationMethod: z
    .enum([
      "api",
      "schema-org-jsonld",
      "microdata",
      "manual-live-check",
      "user-import",
      "open-license-dataset",
    ])
    .nullable(),
  instructionSource: z.enum([
    "provider-api",
    "structured-data",
    "source-page",
    "user-import",
    "none",
  ]),
  imageSource: z.string().nullable(),
  licenseOrUsageBasis: z.string(),
});
export const recipeSchema = z.object({
  provenance: provenanceSchema.default({
    type: "UNVERIFIED",
    sourceName: "",
    sourceUrl: null,
    sourceRecipeTitle: "",
    sourceAuthor: null,
    sourceExternalId: null,
    verifiedAt: null,
    verificationMethod: null,
    instructionSource: "none",
    imageSource: null,
    licenseOrUsageBasis: "Legacy record: no verified usage basis",
  }),
  verificationStatus: z
    .enum([
      "verified",
      "source-linked",
      "temporarily-unavailable",
      "unverified",
    ])
    .default("unverified"),
  instructionAvailability: z
    .enum(["full", "source-only"])
    .default("source-only"),
  sourceSnapshot: z
    .object({
      url: z.string().url(),
      siteName: z.string(),
      author: z.string().nullable(),
      importedAt: z.string(),
      lastCheckedAt: z.string(),
    })
    .optional(),
  sourceNotes: z.string().optional(),
  id: z.string(),
  title: z.string().min(1).max(200),
  slug: z.string(),
  description: z.string().max(10000),
  image: z.string().nullable(),
  sourceProvider: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().nullable(),
  sourceAuthor: z.string().nullable(),
  externalId: z.string().nullable(),
  cuisine: z.string(),
  category: z.string(),
  difficulty: z.enum(["简单", "普通", "进阶", "未知"]),
  prepTime: z.number().nonnegative().nullable(),
  cookTime: z.number().nonnegative().nullable(),
  totalTime: z.number().nonnegative().nullable(),
  servings: z.number().positive(),
  servingsEstimated: z.boolean().optional(),
  ingredients: z.array(recipeIngredientSchema).min(1).max(100),
  instructions: z.array(instructionSchema).max(100),
  equipment: z.array(z.string()),
  tags: z.array(z.string()),
  allergens: z.array(z.string()),
  nutrition: z.record(z.string(), z.number()).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceUpdatedAt: z.string().nullable(),
  lastFetchedAt: z.string().nullable(),
});
export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;
export const pantryItemSchema = z.object({
  ingredientId: z.string(),
  addedAt: z.string().optional(),
});
export type SelectedIngredient = z.infer<typeof pantryItemSchema>;
export type PantryItem = z.infer<typeof pantryItemSchema>;
export type Ingredient = {
  id: string;
  canonicalName: string;
  displayNameZh: string;
  displayNameEn: string;
  aliases: string[];
  category: string;
  emoji: string;
  pantryStaple: boolean;
  allergens: string[];
  parentIngredientId?: string;
};
export const shoppingItemSchema = recipeIngredientSchema.extend({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  checked: z.boolean(),
});
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
