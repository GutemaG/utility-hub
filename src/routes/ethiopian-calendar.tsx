import { EthiopianLargeCalendar } from "@/components/calendars/ethiopian-large-calendar";
import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ethiopian-calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  useSEO({
    title: "Ethiopian Calendar | Utility Hub",
    description:
      "Explore the Ethiopian calendar with a large interactive view and date conversions.",
    path: "/ethiopian-calendar",
    keywords:
      "ethiopian calendar, ethiopic calendar, calendar converter, ethiopian dates",
    applicationCategory: "Tool",
    featureList: ["Interactive calendar", "Ethiopian date display", "Date navigation"],
  });

  return (
    <div className="flex justify-center">
      <div className="w-full md:w-1/2">
        <EthiopianLargeCalendar />
      </div>
    </div>
  );
}
