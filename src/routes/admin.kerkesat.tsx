import { createFileRoute } from "@tanstack/react-router";
import { OrdersManager } from "@/components/admin/OrdersManager";

export const Route = createFileRoute("/admin/kerkesat")({
  component: () => <OrdersManager />,
});
