import { createFileRoute } from "@tanstack/react-router";
import { SaleEditor } from "@/components/SaleEditor";

type Search = { from?: string };

export const Route = createFileRoute("/_authenticated/quotes/new")({
  validateSearch: (s: Record<string, unknown>): Search => ({ from: typeof s.from === "string" ? s.from : undefined }),
  component: () => {
    const { from } = Route.useSearch();
    return <SaleEditor mode="proforma" fromSaleId={from} />;
  },
});
