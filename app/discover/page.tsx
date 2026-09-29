import { KitchenApp } from "@/components/kitchen-app";
export const metadata = { title: "发现菜谱 · KitchenMate" };
export default function DiscoverPage() { return <KitchenApp aiEnabled={process.env.ENABLE_AI_RECIPE_GENERATION === "true" && Boolean(process.env.LLM_API_KEY)} />; }
