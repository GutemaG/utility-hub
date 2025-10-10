import { FileDropzone } from "@/components/file-drop-zone";
import { payrollColumnDef } from "@/components/payroll-column-def";
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
  useReactTable,
} from "@tanstack/react-table";
import React, { useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";

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

/**
 * Takes a raw data row for a single employee and returns the fully calculated payroll.
 * This is the new, centralized logic hub.
 * @param row - The employee data, typically from an Excel row.
 */
const calculatePayrollForRow = (row: Partial<EmployeeData>): EmployeeData => {
  // 1. Sanitize and parse input values from the row
  const basicSalary = Number(row["Basic Salary"]) || 0;
  const taxableAllowance = Number(row["Total Taxable Allowance"]) || 0;
  const nonTaxableAllowance = Number(row["Total Non Taxable Allowance"]) || 0;
  const otherDeductions = Number(row["Other Deduction"]) || 0;

  // Input validation
  if (isNaN(Number(row["Basic Salary"])) || basicSalary < 0) {
    return {
      ...row,
      error: "Invalid Basic Salary. Must be a number.",
    } as EmployeeData;
  }

  // 2. Perform calculations in sequence
  // Note: Your logic specified that 70% of the taxable allowance is what's actually taxed.
  const taxablePortionOfAllowance = taxableAllowance * 0.7;

  const taxableIncome = basicSalary + taxablePortionOfAllowance;
  const incomeTax = CalculateTax(taxableIncome);
  const employeePension = CalculatePension(basicSalary, false);
  const organizationPension = CalculatePension(basicSalary, true);

  // Your gross salary formula was specific, we replicate it here.
  const grossSalary =
    basicSalary +
    nonTaxableAllowance +
    taxableAllowance -
    taxablePortionOfAllowance;

  const totalDeductions = incomeTax + employeePension + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  // 3. Return the complete, calculated object
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

// --- REUSABLE LOGIC HOOK ---
const usePayrollProcessor = () => {
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setIsProcessing(true);
    setFileError(null);
    setEmployeeData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
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
            'Invalid format. Ensure columns "Employee Name" and "Gross Salary" exist.'
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

  const handleDownloadResults = () => {
    if (employeeData.length === 0) return;
    const dataToExport = employeeData.map(({ ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Results");
    XLSX.writeFile(workbook, "Ethiopian_Payroll_Results.xlsx");
  };

  const handleDownloadSample = () => {
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Template");
    XLSX.writeFile(workbook, "payroll_template.xlsx");
  };

  return {
    employeeData,
    isProcessing,
    fileError,
    processFile,
    handleDownloadResults,
    handleDownloadSample,
  };
};

const ResultsTable: React.FC<{ data: EmployeeData[] }> = ({ data }) => {
  const table = useReactTable({
    data,
    columns: payrollColumnDef,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnPinning: {
        left: ["employeeName", "basicSalary"],
        right: ["netSalary"],
      },
    },
  });

  return (
    <>
      <div className="rounded-md border">
        <Table className="">
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
      </div>
    </>
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
/**
 * BulkPayrollProcessor is a React component that provides a user interface for bulk payroll calculation
 * for Ethiopian employees. It allows users to upload an Excel payroll sheet, processes the data according
 * to Ethiopian tax and pension rules, and displays the results with options to download both sample templates
 * and processed results.
 *
 * Features:
 * - Upload Excel payroll sheets for multiple employees.
 * - Calculates income tax, pension (employee and employer), gross and net salary.
 * - Displays processing results in a table.
 * - Downloadable results and sample template.
 * - SEO structured data for discoverability.
 *
 * @returns {JSX.Element} The rendered payroll processor UI.
 *
 * @remarks
 * <details>
 * <summary><strong>NB & Important: How the Payroll Sheet Works</strong></summary>
 *
 * - The payroll sheet must follow the provided sample template. <br/>
 * - <strong>You cannot change the column names</strong>; only add or edit rows as needed. <br/>
 * - The following columns are <strong>required</strong> for pension and payroll calculation:
 *   - <code>employee name</code>
 *   - <code>basic salary</code>
 *   - <code>total taxable allowance</code>
 *   - <code>total non taxable allowance</code>
 *   - <code>other deduction</code>
 * - Ensure all required fields are filled for each employee row to avoid errors during processing.
 * </details>
 */
function BulkPayrollProcessor() {
  const {
    employeeData,
    isProcessing,
    fileError,
    processFile,
    handleDownloadResults,
    handleDownloadSample,
  } = usePayrollProcessor();

  // SEO structured data for tax calculator
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Ethiopian Payroll Generator",
    description:
      "Free online Ethiopian payroll generator for bulk employee processing. Instantly calculate income tax, pension, gross and net salary for multiple employees using Excel upload. Supports Ethiopian tax and pension rules for 2024.",
    url: "https://utility.ethioqr.app/payroll-generator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Bulk payroll calculation from Excel",
      "Ethiopian income tax calculation",
      "Employee and employer pension calculation",
      "Gross and net salary breakdown",
      "Tax bracket and deduction details",
      "Downloadable results and templates",
    ],
    keywords: [
      "Ethiopian payroll calculator",
      "Ethiopian payroll generator",
      "income tax",
      "pension",
      "bulk salary processing",
      "payroll Excel upload",
      "salary calculator Ethiopia",
      "tax 2024",
    ],
  };

  // Add structured data to page head
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div style={{ display: "none" }}>
        <title>Ethiopian Payroll Generator</title>
        <meta
          name="description"
          content="Free Ethiopian payroll generator for 2024. Instantly calculate income tax, pension, gross and net salary for multiple employees using Excel upload. Supports Ethiopian tax and pension rules for bulk payroll processing."
        />
        <meta
          name="keywords"
          content="Ethiopian payroll generator, bulk payroll, income tax calculator, pension calculator, salary calculator, Ethiopia payroll 2024, Excel payroll upload, gross to net salary"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="Ethiopian Payroll generator 2025 - Bulk Salary & Tax Processing"
        />
        <meta
          property="og:description"
          content="Calculate Ethiopian payroll, income tax, and pension for multiple employees with our free online bulk payroll calculator. Upload Excel sheets and get detailed results."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/payroll-generator"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ethiopian Payroll Generator 2024" />
        <meta
          name="twitter:description"
          content="Free Ethiopian payroll Generator for bulk salary, tax, and pension processing. Upload Excel and get instant results."
        />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/payroll-generator"
        />
      </div>
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
          <div className="p-3">
            <div className="grid md:grid-cols-2 gap-6">
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

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  NB & Important: How the Payroll Sheet Works
                </h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>
                    Use the provided sample template; do not rename columns.
                  </li>
                  <li>Required columns:</li>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>employee name</li>
                    <li>basic salary</li>
                    <li>total taxable allowance</li>
                    <li>total non taxable allowance</li>
                    <li>other deduction</li>
                  </ul>
                  <li>
                    Ensure all required fields are filled to avoid errors.
                  </li>
                </ul>
              </div>
            </div>
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
              <div className="mt-4 p-3 bg-red-100 texit-red-800 rounded-lg text-sm">
                <strong>Error:</strong> {fileError}
              </div>
            )}
          </div>
        </div>
        {employeeData.length > 0 && (
          <div className="">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4 min-w-5xl">
                <h2 className="text-lg font-semibold text-gray-800">
                  Processing Results
                </h2>
                <button
                  onClick={handleDownloadResults}
                  className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Download Results
                </button>
              </div>
              <ResultsTable data={employeeData} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
