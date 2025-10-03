import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DayPickerProps } from "react-day-picker";
import { Calendar } from "./calendar";
import { format } from "date-fns";
import { EthiopianCalendar } from "./ethiopian-calendar";
import { formatEthiopianDate } from "@/lib/EthiopianDateUtils";
import { Separator } from "../ui/separator";

type DatePickerProps = {
  date?: Date;
  setDate?: (date: Date) => void;
} & DayPickerProps;

export function EthiopianGregorianDatePicker({
  date: propDate = new Date(),
  setDate: propSetDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date>(propDate ?? new Date());
  const [month, setMonth] = React.useState<Date>(propDate ?? new Date());
  // const [showCalendar, setShowCalendar] = React.useState<
  //   "gregorian" | "ethiopian" | "both"
  // >("both");

  React.useEffect(() => {
    propSetDate?.(date!);
    setMonth(date);
  }, [date, propSetDate]);

  React.useEffect(() => {
    setDate(propDate);
  }, [propDate]);

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-70 justify-between font-normal"
          >
            {format(date, "PPP")}
            <Separator orientation="vertical" />
            {formatEthiopianDate(date, "PPP")}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-full overflow-auto p-0"
          align="start"
        >
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-auto">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                month={month}
                defaultMonth={month}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  if (date) {
                    setDate(date);
                    setOpen(false);
                  }
                }}
              />
              <div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDate(new Date());
                    setMonth(new Date());
                  }}
                  className="p-2 ml-2 text-blue-500 hover:bg-transparent hover:underline-0 focus:bg-transparent active:bg-transparent"
                >
                  Today
                </Button>
              </div>
            </div>
            <div className="border-t md:border-t-0 md:border-l w-full md:w-auto">
              <EthiopianCalendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                defaultMonth={month}
                captionLayout="dropdown"
                onSelect={(date) => {
                  if (date) {
                    setDate(date);
                    setOpen(false);
                  }
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
