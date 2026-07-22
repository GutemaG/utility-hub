import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Faker } from "@faker-js/faker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/mock-data-generator")({
  component: RouteComponent,
});

type FieldType =
  | "rowNumber"
  | "uuid"
  | "fullName"
  | "firstName"
  | "lastName"
  | "jobTitle"
  | "username"
  | "email"
  | "url"
  | "ip"
  | "avatar"
  | "streetAddress"
  | "city"
  | "state"
  | "zipCode"
  | "country"
  | "company"
  | "phone"
  | "integer"
  | "decimal"
  | "date"
  | "boolean"
  | "color"
  | "words"
  | "sentence"
  | "paragraph"
  | "customList";

const FIELD_TYPES: { value: FieldType; label: string; category: string }[] = [
  { value: "rowNumber", label: "Row Number", category: "Numbers" },
  { value: "integer", label: "Integer", category: "Numbers" },
  { value: "decimal", label: "Decimal", category: "Numbers" },
  { value: "fullName", label: "Full Name", category: "Person" },
  { value: "firstName", label: "First Name", category: "Person" },
  { value: "lastName", label: "Last Name", category: "Person" },
  { value: "jobTitle", label: "Job Title", category: "Person" },
  { value: "username", label: "Username", category: "Person" },
  { value: "email", label: "Email Address", category: "Internet" },
  { value: "url", label: "URL", category: "Internet" },
  { value: "ip", label: "IP Address", category: "Internet" },
  { value: "avatar", label: "Avatar Image URL", category: "Internet" },
  { value: "streetAddress", label: "Street Address", category: "Location" },
  { value: "city", label: "City", category: "Location" },
  { value: "state", label: "State/Province", category: "Location" },
  { value: "zipCode", label: "Zip/Postal Code", category: "Location" },
  { value: "country", label: "Country", category: "Location" },
  { value: "company", label: "Company Name", category: "Company" },
  { value: "phone", label: "Phone Number", category: "Other" },
  { value: "date", label: "Date", category: "Date & Time" },
  { value: "boolean", label: "Boolean", category: "Other" },
  { value: "color", label: "Color", category: "Other" },
  { value: "uuid", label: "UUID", category: "Other" },
  { value: "words", label: "Words", category: "Text" },
  { value: "sentence", label: "Sentence", category: "Text" },
  { value: "paragraph", label: "Paragraph", category: "Text" },
  { value: "customList", label: "Custom List", category: "Other" },
];

const FIELD_TYPE_CATEGORIES = Array.from(new Set(FIELD_TYPES.map((f) => f.category)));

interface Field {
  id: string;
  name: string;
  type: FieldType;
  min?: number;
  max?: number;
  decimals?: number;
  listValues?: string;
  dateFrom?: string;
  dateTo?: string;
}

type OutputFormat = "csv" | "json" | "sql" | "excel";

let nextFieldId = 0;
function makeField(name: string, type: FieldType): Field {
  nextFieldId += 1;
  return { id: `field-${nextFieldId}`, name, type };
}

function defaultFields(): Field[] {
  return [
    makeField("id", "rowNumber"),
    makeField("first_name", "firstName"),
    makeField("last_name", "lastName"),
    makeField("email", "email"),
  ];
}

let fakerPromise: Promise<Faker> | null = null;
function loadFaker() {
  if (!fakerPromise) fakerPromise = import("@faker-js/faker/locale/en").then((m) => m.faker);
  return fakerPromise;
}

type RowValue = string | number | boolean;

function generateValue(faker: Faker, field: Field, rowIndex: number): RowValue {
  switch (field.type) {
    case "rowNumber":
      return rowIndex + 1;
    case "uuid":
      return faker.string.uuid();
    case "fullName":
      return faker.person.fullName();
    case "firstName":
      return faker.person.firstName();
    case "lastName":
      return faker.person.lastName();
    case "jobTitle":
      return faker.person.jobTitle();
    case "username":
      return faker.internet.username();
    case "email":
      return faker.internet.email();
    case "url":
      return faker.internet.url();
    case "ip":
      return faker.internet.ip();
    case "avatar":
      return faker.image.avatar();
    case "streetAddress":
      return faker.location.streetAddress();
    case "city":
      return faker.location.city();
    case "state":
      return faker.location.state();
    case "zipCode":
      return faker.location.zipCode();
    case "country":
      return faker.location.country();
    case "company":
      return faker.company.name();
    case "phone":
      return faker.phone.number();
    case "date": {
      const from = field.dateFrom || "2020-01-01";
      const to = field.dateTo || "2025-12-31";
      return faker.date.between({ from, to }).toISOString().slice(0, 10);
    }
    case "boolean":
      return faker.datatype.boolean();
    case "color":
      return faker.color.human();
    case "words":
      return faker.lorem.words(3);
    case "sentence":
      return faker.lorem.sentence();
    case "paragraph":
      return faker.lorem.paragraph();
    case "integer":
      return faker.number.int({ min: field.min ?? 0, max: field.max ?? 100 });
    case "decimal":
      return faker.number.float({
        min: field.min ?? 0,
        max: field.max ?? 100,
        fractionDigits: field.decimals ?? 2,
      });
    case "customList": {
      const values = (field.listValues ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      return values.length > 0 ? faker.helpers.arrayElement(values) : "";
    }
    default:
      return "";
  }
}

function csvEscape(value: RowValue): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: Record<string, RowValue>[], fields: Field[]): string {
  const header = fields.map((f) => csvEscape(f.name)).join(",");
  const lines = rows.map((row) => fields.map((f) => csvEscape(row[f.name])).join(","));
  return [header, ...lines].join("\n");
}

function toSQL(rows: Record<string, RowValue>[], fields: Field[], tableName: string): string {
  const cols = fields.map((f) => f.name).join(", ");
  const values = rows.map((row) => {
    const vals = fields.map((f) => {
      const v = row[f.name];
      if (typeof v === "number") return String(v);
      if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
      return `'${String(v).replace(/'/g, "''")}'`;
    });
    return `(${vals.join(", ")})`;
  });
  return `INSERT INTO ${tableName || "table_name"} (${cols}) VALUES\n${values.join(",\n")};`;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RouteComponent() {
  const [fields, setFields] = useState<Field[]>(defaultFields());
  const [rowCount, setRowCount] = useState(10);
  const [format, setFormat] = useState<OutputFormat>("csv");
  const [tableName, setTableName] = useState("my_table");
  const [rows, setRows] = useState<Record<string, RowValue>[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useSEO({
    title: "Mock Data Generator | Utility Hub",
    description:
      "Design a schema and generate realistic mock/test data — names, emails, addresses, dates, numbers, and more. Export as CSV, JSON, SQL, or Excel.",
    path: "/mock-data-generator",
    keywords: "mock data generator, fake data, test data, mockaroo alternative, csv generator, json generator, sql insert generator",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Custom schema builder",
      "Realistic person, address, internet, and company data",
      "Export as CSV, JSON, SQL, or Excel",
      "Live preview table",
    ],
  });

  const generate = async () => {
    setGenerating(true);
    try {
      const faker = await loadFaker();
      const generated = Array.from({ length: rowCount }, (_, rowIndex) => {
        const row: Record<string, RowValue> = {};
        for (const field of fields) {
          row[field.name || `field_${fields.indexOf(field) + 1}`] = generateValue(faker, field, rowIndex);
        }
        return row;
      });
      setRows(generated);
    } finally {
      setGenerating(false);
    }
  };

  const addField = () => {
    setFields((prev) => [...prev, makeField(`field_${prev.length + 1}`, "fullName")]);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: string, patch: Partial<Field>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const formattedText =
    rows.length === 0
      ? ""
      : format === "csv"
        ? toCSV(rows, fields)
        : format === "json"
          ? JSON.stringify(rows, null, 2)
          : format === "sql"
            ? toSQL(rows, fields, tableName)
            : "";

  const copyOutput = async () => {
    if (!formattedText) return;
    const didCopy = await copyText(formattedText);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const download = async () => {
    if (rows.length === 0) return;
    if (format === "csv") downloadFile(toCSV(rows, fields), "mock-data.csv", "text/csv");
    else if (format === "json") downloadFile(JSON.stringify(rows, null, 2), "mock-data.json", "application/json");
    else if (format === "sql") downloadFile(toSQL(rows, fields, tableName), "mock-data.sql", "text/plain");
    else {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, "mock-data.xlsx");
    }
  };

  const previewRows = rows.slice(0, 20);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Mock Data Generator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Design a schema, then generate realistic mock data and export it as CSV, JSON, SQL, or
          Excel.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-3">
        <Label className="text-sm">Schema</Label>
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
          >
            <Input
              value={field.name}
              onChange={(e) => updateField(field.id, { name: e.target.value })}
              placeholder="Field name"
              className="sm:w-48"
            />
            <Select
              value={field.type}
              onValueChange={(value) => updateField(field.id, { type: value as FieldType })}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_CATEGORIES.map((category) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {FIELD_TYPES.filter((f) => f.category === category).map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {field.type === "integer" || field.type === "decimal" ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={field.min ?? 0}
                  onChange={(e) => updateField(field.id, { min: Number(e.target.value) })}
                  placeholder="Min"
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  value={field.max ?? 100}
                  onChange={(e) => updateField(field.id, { max: Number(e.target.value) })}
                  placeholder="Max"
                  className="w-20"
                />
                {field.type === "decimal" ? (
                  <Input
                    type="number"
                    value={field.decimals ?? 2}
                    onChange={(e) => updateField(field.id, { decimals: Number(e.target.value) })}
                    placeholder="Decimals"
                    className="w-20"
                    title="Decimal places"
                  />
                ) : null}
              </div>
            ) : null}

            {field.type === "date" ? (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={field.dateFrom ?? "2020-01-01"}
                  onChange={(e) => updateField(field.id, { dateFrom: e.target.value })}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={field.dateTo ?? "2025-12-31"}
                  onChange={(e) => updateField(field.id, { dateTo: e.target.value })}
                />
              </div>
            ) : null}

            {field.type === "customList" ? (
              <Input
                value={field.listValues ?? ""}
                onChange={(e) => updateField(field.id, { listValues: e.target.value })}
                placeholder="value1, value2, value3"
                className="flex-1"
              />
            ) : null}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="sm:ml-auto"
              onClick={() => removeField(field.id)}
              disabled={fields.length <= 1}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addField}>
          + Add Field
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Row Count</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={rowCount}
              onChange={(e) => setRowCount(Math.min(1000, Math.max(1, Number(e.target.value) || 1)))}
              className="w-28"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {format === "sql" ? (
            <div className="space-y-2">
              <Label className="text-sm">Table Name</Label>
              <Input value={tableName} onChange={(e) => setTableName(e.target.value)} className="w-40" />
            </div>
          ) : null}
          <Button type="button" onClick={generate} disabled={generating || fields.length === 0}>
            {generating ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              Preview {rows.length > 20 ? `(first 20 of ${rows.length} rows)` : `(${rows.length} rows)`}
            </Label>
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  {fields.map((f) => (
                    <TableHead key={f.id}>{f.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {fields.map((f) => (
                      <TableCell key={f.id} className="whitespace-nowrap font-mono text-xs">
                        {String(row[f.name])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Output</Label>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="ghost" disabled={format === "excel"} onClick={copyOutput}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={download}>
                Download {format === "excel" ? ".xlsx" : `.${format}`}
              </Button>
            </div>
          </div>
          {format === "excel" ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Excel is a binary format — use Download to save the .xlsx file.
            </p>
          ) : (
            <Textarea readOnly value={formattedText} className="min-h-40 font-mono text-xs" />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default RouteComponent;
