import { createFileRoute } from "@tanstack/react-router";
import { SaleEditor } from "@/components/SaleEditor";

export const Route = createFileRoute("/_authenticated/sales/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <SaleEditor saleId={id} />;
  },
});
