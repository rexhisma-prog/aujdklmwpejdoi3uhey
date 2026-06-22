import { createFileRoute } from "@tanstack/react-router";
import { ServicesManager } from "@/components/admin/ServicesManager";

export const Route = createFileRoute("/admin/sherbimet")({
  component: () => <ServicesManager />,
});
