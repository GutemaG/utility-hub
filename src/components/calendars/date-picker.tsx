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

type DatePickerProps = {
  date?: Date;
  setDate?: (date: Date) => void;
} & DayPickerProps;

export function DatePicker({
  date: propDate = new Date(),
  setDate: propSetDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date>(propDate ?? new Date());

  React.useEffect(() => {
    propSetDate?.(date!);
  }, [date, propSetDate]);

  React.useEffect(() => {
    setDate(propDate);
  }, [propDate]);
//   Gregorian Calendar

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-48 justify-between font-normal"
          >
            {format(date, "PPP")}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={(date) => {
              if (date) {
                setDate(date);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
