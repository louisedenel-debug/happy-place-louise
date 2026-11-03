import { createFileRoute, redirect } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard-view";

export const Route = createFileRoute("/_authenticated/actions")({
  head: () => ({ meta: [{ title: "Happy Place — Vos actions" }] }),
  // Les actions de Marc vivent dans les pages de gestion.
  beforeLoad: ({ context }) => {
    if (context.role === "admin") throw redirect({ to: "/manage/news" });
  },
  component: () => <Dashboard view="actions" />,
});
