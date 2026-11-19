"use client";

import { Download } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { exportCustomersCsv } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";

export function ExportCustomersButton({ q }: { q: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await exportCustomersCsv(q);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          const url = URL.createObjectURL(
            new Blob([r.data.csv], { type: "text/csv;charset=utf-8" }),
          );
          Object.assign(document.createElement("a"), {
            href: url,
            download: r.data.filename,
          }).click();
          URL.revokeObjectURL(url);
        })
      }
    >
      <Download aria-hidden /> Export CSV
    </Button>
  );
}
