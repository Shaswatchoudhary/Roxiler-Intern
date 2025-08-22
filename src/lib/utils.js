import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
//clsx is used to merge the classes
//twMerge is used to merge the classes because clsx can return undefined
//we use this because of we are using supabase auth and we want to merge the classes
//so we use clsx to merge the classes and twMerge to merge the classes we used before
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
