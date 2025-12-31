import type { FormResponse } from "@/services/supabase.service";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractResopnseIdentifier(
  response: FormResponse
): string {
  let identifier: string | null = `Response ${response.id}`;

  const data = response.data;
  const firstField = Object.values(data)[0];
  if (firstField && String(firstField).trim()) {
    const fieldValue = String(firstField);
    identifier = `response "${fieldValue.substring(0, 30)}${
      fieldValue.length > 30 ? "..." : ""
    }"`;
  }

  return identifier
}
