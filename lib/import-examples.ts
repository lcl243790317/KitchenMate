import { z } from "zod";
import data from "@/data/verified-import-examples.json";

const exampleSchema = z.object({
  siteName: z.string().min(1),
  recipeTitle: z.string().min(1),
  url: z.url().startsWith("https://"),
  verifiedAt: z.iso.date(),
  fieldsAvailable: z.array(z.string().min(1)).min(3),
  notes: z.string(),
  status: z.enum(["verified", "temporarily-unavailable"]).default("verified"),
});
export const verifiedImportExamples = z.array(exampleSchema).parse(data);
