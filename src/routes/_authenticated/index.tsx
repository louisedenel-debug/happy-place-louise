import { createFileRoute, redirect } from "@tanstack/react-router";

// Les trois profils s'ouvrent sur la vue d'ensemble ; « Vos actions » se choisit ensuite dans le menu.
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: () => {
    throw redirect({ to: "/vue", replace: true });
  },
});
