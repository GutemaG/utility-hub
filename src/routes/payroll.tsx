import { FileDropzone } from "@/components/file-drop-zone";
import type { EmployeeData } from "@/lib/constants";
import { CalculatePension, CalculateTax } from "@/lib/helpers";
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/payroll")({
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
  const headerName = [
    "Employee Name",
    "Basic Salary",
    "Taxable Allowance",
    "Non Taxable Allowance",
    "Gross Salary",
    "Taxable Income",
    "Income Tax",
    "Employee Pension(7%)",
    "Organization Pension(11%)",
    "Total Deduction",
    "Net Salary",
  ];
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headerName.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Employee Name
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className={row.error ? "bg-red-50" : ""}>
              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Employee Name"]}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Basic Salary"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>

              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Total Taxable Allowance"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>

              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Total Non Taxable Allowance"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Gross Salary"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>

              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Taxable Income"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>

              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Income Tax"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Employee Pension"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Organization Pension"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {row["Total Deduction"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-green-700">
                {row["Net Salary"]?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
          {data.length > 0 && (
            <tr className="bg-gray-100 font-bold">
              <td className="px-4 py-3 text-sm text-gray-900">Total</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce((sum, row) => sum + (row["Basic Salary"] ?? 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce(
                    (sum, row) => sum + (row["Total Taxable Allowance"] ?? 0),
                    0
                  )
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce(
                    (sum, row) =>
                      sum + (row["Total Non Taxable Allowance"] ?? 0),
                    0
                  )
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce((sum, row) => sum + (row["Gross Salary"] ?? 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce((sum, row) => sum + (row["Taxable Income"] ?? 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce((sum, row) => sum + (row["Income Tax"] ?? 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce((sum, row) => sum + (row["Employee Pension"] ?? 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce(
                    (sum, row) => sum + (row["Organization Pension"] ?? 0),
                    0
                  )
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {data
                  .reduce((sum, row) => sum + (row["Total Deduction"] ?? 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td className="px-4 py-3 text-sm text-green-800">
                {data
                  .reduce((sum, row) => sum + (row["Net Salary"] ?? 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
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

  // SEO structured data for tax calculator
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Ethiopian Payroll Calculator",
    description:
      "Free online Ethiopian payroll calculator for bulk employee processing. Instantly calculate income tax, pension, gross and net salary for multiple employees using Excel upload. Supports Ethiopian tax and pension rules for 2024.",
    url: "https://utility.ethioqr.app/payroll",
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
        <title>Ethiopian Payroll Calculator</title>
        <meta
          name="description"
          content="Free Ethiopian payroll calculator for 2024. Instantly calculate income tax, pension, gross and net salary for multiple employees using Excel upload. Supports Ethiopian tax and pension rules for bulk payroll processing."
        />
        <meta
          name="keywords"
          content="Ethiopian payroll calculator, bulk payroll, income tax calculator, pension calculator, salary calculator, Ethiopia payroll 2024, Excel payroll upload, gross to net salary"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="Ethiopian Payroll Calculator 2024 - Bulk Salary & Tax Processing"
        />
        <meta
          property="og:description"
          content="Calculate Ethiopian payroll, income tax, and pension for multiple employees with our free online bulk payroll calculator. Upload Excel sheets and get detailed results."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://utility.ethioqr.app/payroll" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Ethiopian Payroll Calculator 2024"
        />
        <meta
          name="twitter:description"
          content="Free Ethiopian payroll calculator for bulk salary, tax, and pension processing. Upload Excel and get instant results."
        />
        <link rel="canonical" href="https://utility.ethioqr.app/payroll" />
      </div>
      <div className="mx-auto p-4 space-y-8">
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

          {employeeData.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
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
          )}
        </div>
      </div>
    </>
  );
}
