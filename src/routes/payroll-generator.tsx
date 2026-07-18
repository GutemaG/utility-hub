import { FileDropzone } from "@/components/file-drop-zone";
import { payrollColumnDef } from "@/components/payroll-column-def";
import { useSEO } from "@/hooks/use-seo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import type { EmployeeData } from "@/lib/constants";
import { CalculatePension, CalculateTax } from "@/lib/helpers";
import { createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react"; // Added for the collapsible icon
import React, { useState, useCallback } from "react";

export const Route = createFileRoute("/payroll-generator")({
  component: BulkPayrollProcessor,
});

const sampleData: Omit<EmployeeData, "error">[] = [
  {
    "Employee Name": "Abebe Kebede",
    "Basic Salary": 57289.66,
    "Total Taxable Allowance": 0,
    "Total Non Taxable Allowance": 2200,
    "Other Deduction": 0,
  },
  {
    "Employee Name": "Hana Alemu",
    "Basic Salary": 70155.24,
    "Total Taxable Allowance": 0,
    "Total Non Taxable Allowance": 2200,
    "Other Deduction": 0,
  },
  {
    "Employee Name": "Yonas Berhanu",
    "Basic Salary": 6426,
    "Total Taxable Allowance": 0,
    "Total Non Taxable Allowance": 0,
    "Other Deduction": 0,
  },
];

const calculatePayrollForRow = (row: Partial<EmployeeData>): EmployeeData => {
  const basicSalary = Number(row["Basic Salary"]) || 0;
  const taxableAllowance = Number(row["Total Taxable Allowance"]) || 0;
  const nonTaxableAllowance = Number(row["Total Non Taxable Allowance"]) || 0;
  const otherDeductions = Number(row["Other Deduction"]) || 0;

  if (isNaN(Number(row["Basic Salary"])) || basicSalary < 0) {
    return {
      ...row,
      error: "Invalid Basic Salary. Must be a number.",
    } as EmployeeData;
  }

  const taxablePortionOfAllowance = taxableAllowance * 0.7;
  const taxableIncome = basicSalary + taxablePortionOfAllowance;
  const incomeTax = CalculateTax(taxableIncome);
  const employeePension = CalculatePension(basicSalary, false);
  const organizationPension = CalculatePension(basicSalary, true);
  const grossSalary =
    basicSalary +
    nonTaxableAllowance +
    taxableAllowance -
    taxablePortionOfAllowance;
  const totalDeductions = incomeTax + employeePension + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  return {
    ...row,
    "Employee Name": row["Employee Name"] || "N/A",
    "Basic Salary": basicSalary,
    "Total Taxable Allowance": taxableAllowance,
    "Total Non Taxable Allowance": nonTaxableAllowance,
    "Other Deduction": otherDeductions,
    "Gross Salary": grossSalary,
    "Taxable Income": taxableIncome,
    "Income Tax": incomeTax,
    "Employee Pension": employeePension,
    "Organization Pension": organizationPension,
    "Total Deduction": totalDeductions,
    "Net Salary": netSalary,
  };
};

const usePayrollProcessor = () => {
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileError(null);
    setEmployeeData([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<never>(worksheet);

        if (
          json.length > 0 &&
          (json[0]["Employee Name"] === undefined ||
            json[0]["Basic Salary"] === undefined)
        ) {
          throw new Error(
            'Invalid format. Ensure columns "Employee Name" and "Basic Salary" exist.'
          );
        }

        const processedData = json.map(calculatePayrollForRow);
        setEmployeeData(processedData);
      } catch (error) {
        setFileError(
          error instanceof Error ? error.message : "An unknown error occurred."
        );
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setFileError("Failed to read the file.");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDownloadResults = useCallback(async () => {
    if (employeeData.length === 0) return;
    const XLSX = await import("xlsx");
    const dataToExport = employeeData.map(({ ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Results");
    XLSX.writeFile(workbook, "Ethiopian_Payroll_Results.xlsx");
  }, [employeeData]);

  const handleDownloadSample = useCallback(async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Template");
    XLSX.writeFile(workbook, "payroll_template.xlsx");
  }, []);

  return {
    employeeData,
    isProcessing,
    fileError,
    processFile,
    handleDownloadResults,
    handleDownloadSample,
  };
};

// ## MODIFIED COMPONENT ##
// The wrapper div now has `overflow-x-auto` to allow horizontal scrolling on small screens.
const ResultsTable: React.FC<{ data: EmployeeData[] }> = ({ data }) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const table = useReactTable({
    data,
    columns: payrollColumnDef,
    getCoreRowModel: getCoreRowModel(),
    globalFilterFn: "includesString",
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      columnPinning: {
        left: ["employeeName", "basicSalary"],
        right: ["netSalary"],
      },
    },
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination, //update the pagination state when internal APIs mutate the pagination state
    state: {
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="rounded-md border overflow-x-auto">
      <div className="flex items-center gap-2 p-4 bg-gray-50 border-b">
        <label htmlFor="payroll-search" className="text-sm text-gray-700">
          Search:
        </label>
        <input
          id="payroll-search"
          type="text"
          placeholder="Search employee name..."
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            const value = e.target.value.toLowerCase();
            table.setGlobalFilter(value);
          }}
          aria-label="Search employee name"
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={payrollColumnDef.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          {table.getFooterGroups().map((footerGroup) => (
            <TableRow key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <TableCell key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableFooter>
      </Table>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-gray-50 border-t rounded-b-md">
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="First Page"
          >
            <span className="sr-only">First</span>
            {"<<"}
          </button>
          <button
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous Page"
          >
            <span className="sr-only">Previous</span>
            {"<"}
          </button>
          <span className="mx-2 text-sm text-gray-700">
            Page{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount().toLocaleString()}
            </strong>
          </span>
          <button
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next Page"
          >
            <span className="sr-only">Next</span>
            {">"}
          </button>
          <button
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Last Page"
          >
            <span className="sr-only">Last</span>
            {">>"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="goto-page" className="text-sm text-gray-700">
            Go to page:
          </label>
          <input
            id="goto-page"
            type="number"
            min="1"
            max={table.getPageCount()}
            value={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 w-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600 mt-2 sm:mt-0">
          Showing {table.getRowModel().rows.length.toLocaleString()} of{" "}
          {table.getRowCount().toLocaleString()} rows
        </div>
      </div>
    </div>
  );
};

const SampleTable: React.FC<{ onDownload: () => void }> = ({ onDownload }) => {
  const headerName = [
    "Employee Name",
    "Basic Salary",
    "Total Taxable Allowance",
    "Total Non Taxable Allowance",
    "Other Deduction",
  ];
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Sample Payroll Sheet
        </h3>
        <button
          onClick={onDownload}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Download Template
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-md">
          <thead>
            <tr className="bg-gray-100">
              {headerName.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2 text-sm text-gray-700">
                  {row["Employee Name"]}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {row["Basic Salary"].toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {(row["Total Taxable Allowance"] ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {(row["Total Non Taxable Allowance"] ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {(row["Other Deduction"] ?? 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
function BulkPayrollProcessor() {
  const {
    employeeData,
    isProcessing,
    fileError,
    processFile,
    handleDownloadResults,
    handleDownloadSample,
  } = usePayrollProcessor();

  useSEO({
    title: "Ethiopian Payroll Generator | Utility Hub",
    description:
      "Process Ethiopian payroll in bulk with income tax, pension, gross pay, and net pay calculations from Excel uploads.",
    path: "/payroll-generator",
    keywords:
      "Ethiopian payroll generator, bulk payroll, income tax calculator, pension calculator, salary calculator Ethiopia",
    applicationCategory: "FinanceApplication",
    featureList: [
      "Bulk payroll calculation",
      "Income tax calculation",
      "Pension calculation",
      "Gross and net salary breakdown",
      "Excel upload support",
    ],
  });

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bulk Payroll Processor
          </h1>
          <p className="text-base text-gray-600">
            Upload an Excel file to calculate payroll for multiple employees.
          </p>
        </header>

        <div className="space-y-6">
          <SampleTable onDownload={handleDownloadSample} />
          <div className="p-3 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Features
              </h4>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Upload Excel payroll sheets for multiple employees.</li>
                <li>Calculates income tax, employee and employer pension.</li>
                <li>Shows gross and net salary breakdown.</li>
                <li>Downloadable processed results and sample template.</li>
                <li>Built for Ethiopian tax and pension rules.</li>
              </ul>
            </div>

            {/* ## MODIFIED COMPONENT ##
            // This section is now collapsible. */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-lg border bg-gray-50 p-3 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <h4 className="text-sm font-semibold text-gray-800">
                    NB & Important: How the Payroll Sheet Works
                  </h4>
                  <ChevronDown className="h-5 w-5 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 text-sm text-gray-700">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Use the provided sample template;{" "}
                    <strong>do not rename columns.</strong>
                  </li>
                  <li>
                    The following columns are <strong>required</strong>:
                    <ul className="list-['-_'] mt-1 space-y-1 pl-6">
                      <li>
                        <code>employee name</code>
                      </li>
                      <li>
                        <code>basic salary</code>
                      </li>
                      <li>
                        <code>total taxable allowance</code>
                      </li>
                      <li>
                        <code>total non taxable allowance</code>
                      </li>
                      <li>
                        <code>other deduction</code>
                      </li>
                    </ul>
                  </li>
                  <li>
                    Ensure all required fields are filled for each employee to
                    avoid errors.
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Upload Your Payroll Sheet
            </h2>
            <FileDropzone
              onFileDrop={processFile}
              isProcessing={isProcessing}
            />
            {fileError && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                <strong>Error:</strong> {fileError}
              </div>
            )}
          </div>
        </div>
        {employeeData.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Processing Results
              </h2>
              <button
                onClick={handleDownloadResults}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 w-full sm:w-auto"
              >
                Download Results
              </button>
            </div>
            <ResultsTable data={employeeData} />
          </div>
        )}
      </div>
    </>
  );
}
