import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { taxBrackets } from "@/lib/constants";
import { ChevronDown } from "lucide-react";


export function TaxBracketInfo() {
  return (
<Collapsible className="rounded-lg border border-border bg-card text-card-foreground">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50">
          <span>Ethiopian Tax Brackets</span>

          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Income Range</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Deductible(ETB)</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {taxBrackets.map((bracket, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {bracket.min.toLocaleString()} -{" "}
                    {bracket.max?.toLocaleString() ?? "Above"}
                  </TableCell>

                  <TableCell>{bracket.rate}%</TableCell>

                  <TableCell>
                    {bracket.deductible.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleContent>
      </Collapsible>
  )
}
