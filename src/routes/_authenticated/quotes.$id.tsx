import { createFileRoute } from "@tanstack/react-router";
import { SaleEditor } from "@/components/SaleEditor";

export const Route = createFileRoute("/_authenticated/quotes/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <SaleEditor mode="proforma" saleId={id} />;
  },
});
