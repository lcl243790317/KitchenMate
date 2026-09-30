"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { claimRecipeOrigin, type RecipeOrigin } from "@/lib/recipe-navigation";

export function RecipeBackLink({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [origin, setOrigin] = useState<RecipeOrigin | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setOrigin(claimRecipeOrigin(recipeId)),
    );
    return () => cancelAnimationFrame(frame);
  }, [recipeId]);
  return (
    <Link
      className="back"
      href={origin?.from ?? "/recipes"}
      onClick={(event) => {
        if (
          origin &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          router.back();
        }
      }}
    >
      <ArrowLeft size={16} /> {origin?.label ?? "返回全部教程"}
    </Link>
  );
}
