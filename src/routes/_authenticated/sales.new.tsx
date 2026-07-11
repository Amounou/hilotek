import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SaleEditor } from "@/components/SaleEditor";

const searchSchema = z.object({ from: z.string().optional() });

export const Route = createFileRoute("/_authenticated/sales/new")({
  validateSearch: (s) => searchSchema.parse(s),
  component: () => {
    const { from } = Route.useSearch();
    return <SaleEditor fromSaleId={from} />;
  },
});
