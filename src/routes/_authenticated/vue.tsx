import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard-view";

export const Route = createFileRoute("/_authenticated/vue")({
  head: () => ({
    meta: [
      { title: "Happy Place — Vue d'ensemble" },
      {
        name: "description",
        content:
          "Actualités du cabinet, idées validées, points bloquants et indicateurs de Bigger Boat.",
      },
      { property: "og:title", content: "Happy Place — Vue d'ensemble" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Dashboard view="overview" />,
});
