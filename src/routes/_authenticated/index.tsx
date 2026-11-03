import { createFileRoute, redirect } from "@tanstack/react-router";

// Léa et Julien s'ouvrent sur « Vos actions » ; Marc sur la vue d'ensemble.
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: ({ context }) => {
    throw redirect({ to: context.role === "admin" ? "/vue" : "/actions", replace: true });
  },
});
