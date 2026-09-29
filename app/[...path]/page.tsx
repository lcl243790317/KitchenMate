import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  if (
    (path.length === 1 &&
      ["pantry", "discover", "shopping", "import"].includes(path[0])) ||
    (path[0] === "recipe" &&
      path.length >= 2 &&
      path.length <= 3 &&
      (path.length === 2 || path[2] === "cook"))
  )
    return null;
  notFound();
}
