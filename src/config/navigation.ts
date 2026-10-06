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
        title: "Loan Calculator",
        url: "/loan-calculator",
        description:
          "Calculate monthly payment, total interest, and amortization schedule.",
      },
      {
        title: "Compound Interest Calculator",
        url: "/compound-interest-calculator",
        description: "Savings growth with monthly deposits, APY, yearly breakdown, and an APR to APY converter.",
      },
      {
        title: "Calculator",
        url: "/calculator",
        description: "Scientific calculator with trig, logs, powers, factorials, live results and history.",
      },
      {
        title: "Percentage Calculator",
        url: "/percentage-calculator",
        description: "X% of Y, what percent, percentage change, increase/decrease, difference, discount and VAT.",
      },
      {
        title: "Grade & GPA Calculator",
        url: "/grade-calculator",
        description:
          "Semester GPA and CGPA (Ethiopian and US scales), weighted course grade, and the score you need on the final.",
      },
      {
        title: "BMI Calculation",
        url: "/bmi-calculation",
        description: "Calculate Body Mass Index with health category feedback.",
      },
      {
        title: "Calorie Calculator",
        url: "/calorie-calculator",
        description: "BMR, TDEE and daily calories to lose, maintain or gain weight, with a macro split.",
      },
      {
        title: "Number Sum Calculator",
        url: "/number-sum-calculator",
        description:
          "Paste a column or grid of numbers and get the sum, average, min/max, and per-row/column totals. Handles CSV, tab, and space-separated values, skipping blank lines automatically.",
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
        title: "Volume Conversion",
        url: "/volume-conversion",
        description: "ml to oz, litres to gallons, cups, tablespoons and teaspoons (US and UK).",
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
          "Generate 1D barcodes (Code 128 A/B/C, GS1-128, Code 39/LOGMARS, Code 93, EAN/UPC, ITF-14, MSI, Codabar) and 2D barcodes (QR, Data Matrix, GS1 DataMatrix, MIL-STD-130 IUID, PDF417, Aztec, MaxiCode).",
      },
      {
        title: "QR & Barcode Scanner",
        url: "/qr-barcode-scanner",
        description:
          "Scan QR codes and barcodes with your camera or from an image. Understands Wi-Fi, contact, link, GS1 and IUID codes.",
      },
      {
        title: "Cron Expression Generator",
        url: "/cron-expression",
        description:
          "Build cron schedules, read them in plain English, and see the next run times in any time zone.",
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
        title: "Base64 File Converter",
        url: "/base64-file-converter",
        description:
          "Convert a file to Base64 (data URI or raw), or decode Base64 back into a downloadable file.",
      },
      {
        title: "Integer Base Converter",
        url: "/integer-base-converter",
        description:
          "Convert integers between binary, octal, decimal, hexadecimal, base64, and any custom base.",
      },
      {
        title: "Number Converter",
        url: "/number-converter",
        description:
          "Convert numbers to/from Roman numerals, and look up Ethiopian Ge'ez numerals with Amharic number words.",
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
    title: "Files & Media",
    url: "#",
    items: [
      {
        title: "Image Tools",
        url: "/image-tools",
        description:
          "Compress, resize, crop, rotate and convert images to JPG, PNG or WebP in bulk, or generate a favicon set.",
      },
      {
        title: "PDF Tools",
        url: "/pdf-tools",
        description:
          "Merge, split, reorder and rotate PDFs, convert JPG to PDF and PDF to JPG/PNG, and add page numbers or a watermark.",
      },
      {
        title: "Background Remover",
        url: "/background-remover",
        description:
          "Remove image backgrounds with on-device AI. Transparent PNG, solid colour, blurred or custom backgrounds.",
      },
      {
        title: "Image to Text (OCR)",
        url: "/image-to-text",
        description: "Extract text from photos, screenshots and scanned PDFs, including Amharic and Tigrinya.",
      },
    ],
  },
  {
    title: "Time & Productivity",
    url: "#",
    items: [
      {
        title: "Timer & Stopwatch",
        url: "/online-timer",
        description: "Countdown timer with alarm, stopwatch with laps, and a countdown to any date.",
      },
      {
        title: "Pomodoro Timer",
        url: "/pomodoro-timer",
        description:
          "Focus timer with customizable sessions, breaks, fullscreen mode, and mini floating window.",
      },
      {
        title: "Typing Speed Test",
        url: "/typing-speed-test",
        description: "Measure your typing speed (WPM) and accuracy in English or Amharic.",
      },
    ],
  },
  {
    title: "Design",
    url: "#",
    items: [
      {
        title: "Business Card Generator",
        url: "/business-card-generator",
        description:
          "Design a business card with your logo and a contact QR code, then download print-ready PNG, SVG or an A4 PDF sheet.",
      },
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
        title: "Random Picker",
        url: "/random-tools",
        description: "Spin the wheel of names, flip a coin, roll dice, pick random numbers, or split a list into teams.",
      },
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
