import type { EmployeeData } from "@/lib/constants";
import { type ColumnDef, type Table } from "@tanstack/react-table";

const fmt = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "-";

const sum = (table: Table<EmployeeData>, key: keyof EmployeeData) =>
  table
    .getRowModel()
    .rows.reduce(
      (acc: number, r) =>
        acc + (Number((r.original as EmployeeData)?.[key]) || 0),
      0
    );

export const payrollColumnDef: ColumnDef<EmployeeData>[] = [
  {
    id: "employeeName",
    header: "Employee Name",
    accessorKey: "Employee Name",
    cell: ({ row }) => row.original["Employee Name"] ?? "",
    footer: () => <span className="font-semibold">Totals</span>,
  },
  {
    id: "basicSalary",
    header: "Basic Salary",
    accessorFn: (row) => row["Basic Salary"],
    cell: ({ row }) => fmt(row.original["Basic Salary"]),
    footer: ({ table }) => (
      <span className="font-semibold">{fmt(sum(table, "Basic Salary"))}</span>
    ),
  },
  {
    id: "totalTaxableAllowance",
    header: "Taxable Allowance",
    accessorFn: (row) => row["Total Taxable Allowance"],
    cell: ({ row }) => fmt(row.original["Total Taxable Allowance"]),
    footer: ({ table }) => (
      <span className="font-semibold">
        {fmt(sum(table, "Total Taxable Allowance"))}
      </span>
    ),
  },
  {
    id: "totalNonTaxableAllowance",
    header: "Non Taxable Allowance",
    accessorFn: (row) => row["Total Non Taxable Allowance"],
    cell: ({ row }) => fmt(row.original["Total Non Taxable Allowance"]),
    footer: ({ table }) => (
      <span className="font-semibold">
        {fmt(sum(table, "Total Non Taxable Allowance"))}
      </span>
    ),
  },
  {
    id: "grossSalary",
    header: "Gross Salary",
    accessorFn: (row) => row["Gross Salary"],
    cell: ({ row }) => fmt(row.original["Gross Salary"]),
    footer: ({ table }) => (
      <span className="font-semibold">{fmt(sum(table, "Gross Salary"))}</span>
    ),
  },
  {
    id: "taxableIncome",
    header: "Taxable\nIncome",
    accessorFn: (row) => row["Taxable Income"],
    cell: ({ row }) => fmt(row.original["Taxable Income"]),
    footer: ({ table }) => (
      <span className="font-semibold">{fmt(sum(table, "Taxable Income"))}</span>
    ),
  },
  {
    id: "incomeTax",
    header: "Income Tax",
    accessorFn: (row) => row["Income Tax"],
    cell: ({ row }) => fmt(row.original["Income Tax"]),
    footer: ({ table }) => (
      <span className="font-semibold">{fmt(sum(table, "Income Tax"))}</span>
    ),
  },
  {
    id: "employeePension",
    header: "Employee Pension(7%)",
    accessorFn: (row) => row["Employee Pension"],
    cell: ({ row }) => fmt(row.original["Employee Pension"]),
    footer: ({ table }) => (
      <span className="font-semibold">
        {fmt(sum(table, "Employee Pension"))}
      </span>
    ),
  },
  {
    id: "organizationPension",
    header: "Organization Pension(11%)",
    accessorFn: (row) => row["Organization Pension"],
    cell: ({ row }) => fmt(row.original["Organization Pension"]),
    footer: ({ table }) => (
      <span className="font-semibold">
        {fmt(sum(table, "Organization Pension"))}
      </span>
    ),
  },
  {
    id: "totalDeduction",
    header: "Total Deduction",
    accessorFn: (row) => row["Total Deduction"],
    cell: ({ row }) => fmt(row.original["Total Deduction"]),
    footer: ({ table }) => (
      <span className="font-semibold">
        {fmt(sum(table, "Total Deduction"))}
      </span>
    ),
  },
  {
    id: "netSalary",
    header: "Net Salary",
    accessorFn: (row) => row["Net Salary"],
    cell: ({ row }) => (
      <span className="text-green-500">{fmt(row.original["Net Salary"])}</span>
    ),
    footer: ({ table }) => (
      <span className="font-semibold">{fmt(sum(table, "Net Salary"))}</span>
    ),
  },
];
