import { createFileRoute } from "@tanstack/react-router";
import { DepartureNotices } from "@/components/departure-notices";

export const Route = createFileRoute("/_authenticated/manage/reminders")({
  component: RemindersPage,
});

function RemindersPage() {
  const { email } = Route.useRouteContext();
  return <DepartureNotices email={email ?? ""} />;
}
