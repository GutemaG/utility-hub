import { EthiopianLargeCalendar } from "@/components/calendars/ethiopian-large-calendar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ethiopian-calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex justify-center">
      <div className="w-full md:w-1/2">
        <EthiopianLargeCalendar />
      </div>
    </div>
  );
}
