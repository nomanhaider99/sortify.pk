"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** Read/write listing state in the URL (filters, sort, page) without scrolling to the top. */
export function useListingUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (
      mutate: (params: URLSearchParams) => void,
      { resetPage = true }: { resetPage?: boolean } = {},
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      if (resetPage) params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}` as Route, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const toggleValue = (key: string, value: string) =>
    update((p) => {
      const values = new Set((p.get(key) ?? "").split(",").filter(Boolean));
      if (values.has(value)) values.delete(value);
      else values.add(value);
      if (values.size) p.set(key, [...values].join(","));
      else p.delete(key);
    });

  const setValue = (key: string, value: string | null) =>
    update((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });

  const clearAll = () =>
    update((p) => {
      for (const key of [...p.keys()]) if (key !== "q" && key !== "sort") p.delete(key);
    });

  return { searchParams, update, toggleValue, setValue, clearAll, pending };
}
