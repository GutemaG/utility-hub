export interface NavItem {
  title: string;
  url: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  url: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    title: "Calculation",
    url: "#",
    items: [
      {
        title: "Salary Calculation",
        url: "/salary-calculation",
        description:
          "Estimate income or sales tax based on region or custom rates (Ethiopia only).",
      },
      {
        title: "Payroll Generator",
        url: "/payroll-generator",
        description:
          "Generate detailed payroll reports for employees with deductions and benefits by uploading a CSV file (Ethiopia only).",
      },
      {
        title: "BMI Calculation",
        url: "/bmi-calculation",
        description: "Calculate Body Mass Index with health category feedback.",
      },
      {
        title: "Loan & Mortgage Calculator",
        url: "/loan-mortgage-calculator",
        description: "Calculate monthly payments, interest, and amortization schedule.",
      },
    ],
  },
  {
    title: "Conversion",
    url: "#",
    items: [
      {
        title: "Length Conversion",
        url: "/length-conversion",
        description: "Meters, feet, inches, kilometers, miles, etc.",
      },
      {
        title: "Temperature Conversion",
        url: "/temperature-conversion",
        description: "Celsius, Fahrenheit, Kelvin.",
      },
      {
        title: "Shoe Size Conversion",
        url: "/shoe-size-conversion",
        description: "Men's, women's, and kids' sizes across US, EU, UK.",
      },
      {
        title: "Weight Conversion",
        url: "/weight-conversion",
        description: "Pounds, kilograms, stones, ounces.",
      },
      {
        title: "Area Conversion",
        url: "/area-conversion",
        description: "Square meters, feet, acres, hectares, square miles, etc.",
      },
      {
        title: "Speed Conversion",
        url: "/speed-conversion",
        description: "km/h, mph, knots, m/s.",
      },
      {
        title: "Data Storage Conversion",
        url: "/data-storage-conversion",
        description: "Bits, Bytes, KB, MB, GB, TB, PB — binary & decimal.",
      },
      {
        title: "Time Conversion",
        url: "/time-conversion",
        description: "Seconds, minutes, hours, days, weeks, months, years.",
      },
      {
        title: "Ethiopian Date Convertors",
        url: "/age-and-date-convertors",
        description: "Exact age, date difference, add/subtract days.",
      },
    ],
  },
  {
    title: "Other",
    url: "#",
    items: [
      {
        title: "Password Generator",
        url: "/password-generator",
        description: "Create strong, customizable passwords.",
      },
      {
        title: "UUID Generator",
        url: "/uuid-generator",
        description: "Generate universally unique identifiers.",
      },
      {
        title: "QR Code Generator",
        url: "/qr-code-generator",
        description: "Create QR codes for URLs, text, and more.",
      },
      {
        title: "Markdown Editor",
        url: "/mark-down-editor",
        description: "Create and preview Markdown documents.",
      },
    ],
  },
];
