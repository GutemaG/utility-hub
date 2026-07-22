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
        title: "Loan Calculator",
        url: "/loan-calculator",
        description:
          "Calculate monthly payment, total interest, and amortization schedule.",
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
        title: "Currency Conversion",
        url: "/currency-conversion",
        description: "Live conversion with latest exchange rates from Frankfurter API.",
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
        title: "Hash Generator",
        url: "/hash-generator",
        description:
          "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or a file, and compare against an expected hash.",
      },
      {
        title: "Lorem Ipsum Generator",
        url: "/lorem-ipsum-generator",
        description: "Generate placeholder text by words, sentences, or paragraphs.",
      },
      {
        title: "Mock Data Generator",
        url: "/mock-data-generator",
        description:
          "Design a schema and generate realistic mock data (names, emails, addresses, dates, and more), exported as CSV, JSON, SQL, or Excel.",
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
        title: "Barcode Generator",
        url: "/barcode-generator",
        description:
          "Generate 1D barcodes (CODE128, CODE39, EAN, UPC, ITF-14, MSI, Pharmacode, Codabar) and 2D barcodes (Data Matrix, PDF417, Aztec Code).",
      },
      {
        title: "Markdown Editor",
        url: "/mark-down-editor",
        description:
          "Write and preview Markdown, convert to HTML, copy as rich or raw HTML, and convert HTML back to Markdown.",
      },
      {
        title: "URL Encoder",
        url: "/url-encoder",
        description: "Encode and decode URLs and query-safe strings.",
      },
      {
        title: "Character Counter",
        url: "/character-counter",
        description: "Count characters, words, lines, and reading time.",
      },
      {
        title: "JSON Validator",
        url: "/json-validator",
        description:
          "Validate, repair, minify, diff, tree-view, JSONPath-query, and schema-validate JSON, plus convert to/from CSV, YAML, XML, SQL, and Excel.",
      },
      {
        title: "Base64 Tool",
        url: "/base64-tool",
        description: "Encode and decode Base64 text with Unicode support.",
      },
      {
        title: "JWT Decoder & Encoder",
        url: "/jwt-decoder",
        description: "Decode and verify a JWT's header, payload, and signature, or build and sign a new one.",
      },
      {
        title: "Unix Timestamp",
        url: "/unix-timestamp",
        description: "Convert between Unix timestamp, ISO, UTC, and local time.",
      },
      {
        title: "Regex Tester",
        url: "/regex-tester",
        description: "Test regex patterns with flags and highlighted matches.",
      },
      {
        title: "Cheat Sheets",
        url: "/cheat-sheets",
        description:
          "Searchable quick references for Git, GitHub, editors, shells, regex, Docker, and more.",
      },
      {
        title: "Pomodoro Timer",
        url: "/pomodoro-timer",
        description:
          "Focus timer with customizable sessions, breaks, fullscreen mode, and mini floating window.",
      },
      {
        title: "Emoji Picker",
        url: "/emoji-picker",
        description: "Search, browse by category, and copy emoji with recently used history.",
      },
      {
        title: "Prime Number Checker",
        url: "/prime-number-checker",
        description:
          "Check primality, view factorization, nearest primes, and an interactive sieve grid.",
      },
      {
        title: "Phone Number Parser",
        url: "/phone-number-parser",
        description:
          "Validate and format phone numbers with a searchable country code selector.",
      },
      {
        title: "Matrix Calculator",
        url: "/matrix-calculator",
        description:
          "Add, subtract, multiply, transpose, and invert matrices with an animated step-by-step walkthrough.",
      },
      {
        title: "Internet Speed Test",
        url: "/internet-speed-test",
        description: "Measure download speed, upload speed, latency, and jitter right in your browser.",
      },
    ],
  },
  {
    title: "Design",
    url: "#",
    items: [
      {
        title: "Color Tools",
        url: "/color-tools",
        description:
          "Convert colors between HEX, RGB, HSL, HWB, CIE LCH, and CMYK, browse the Tailwind palette, and generate gradients and color schemes.",
      },
    ],
  },
  {
    title: "Fun",
    url: "#",
    items: [
      {
        title: "ASCII Art Generator",
        url: "/ascii-art-generator",
        description: "Turn text into fun ASCII banners with style controls.",
      },
      {
        title: "Fake Hacker Simulator",
        url: "/fake-hacker-simulator",
        description: "Simulate dramatic terminal activity with typing and fullscreen mode.",
      },
    ],
  },
];
