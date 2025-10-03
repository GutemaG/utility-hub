import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatEthiopianDate } from "@/lib/EthiopianDateUtils";
import { format } from "date-fns";
import type { DayPickerProps } from "react-day-picker";
import { EthiopianCalendar } from "./ethiopian-calendar";

type DatePickerProps = {
  date?: Date;
  setDate?: (date: Date) => void;
} & DayPickerProps;

export function EthiopianDatePicker({
  date: propDate,
  setDate: propSetDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    propDate ?? new Date()
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);

  const [state, setState] = React.useState<"gregorian" | "ethiopian">(
    "ethiopian"
  );
  React.useEffect(() => {
    propSetDate?.(date!);
  }, [date, propSetDate]);

  React.useEffect(() => {
    setDate(propDate);
  }, [propDate]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal pr-2",
                !date && "text-muted-foreground"
              )}
              onClick={() => setOpen(true)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                state === "ethiopian" ? (
                  formatEthiopianDate(date, "PPP")
                ) : (
                  format(date, "PPP")
                )
              ) : (
                <span>Pick a date</span>
              )}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setState((prev) =>
                    prev === "ethiopian" ? "gregorian" : "ethiopian"
                  );
                }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "ml-auto size-6"
                )}
              >
                <span className="text-xs">
                  {state === "ethiopian" ? "ET" : "GR"}
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <EthiopianCalendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                setDate(date);
                setOpen(false);
              }}
              footer={
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  className="mt-2"
                  onClick={() => {
                    const today = new Date();
                    setDate(today);
                    setMonth(today);
                  }}
                >
                  Today
                </Button>
              }
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
