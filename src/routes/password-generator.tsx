import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/password-generator")({
  component: RouteComponent,
});

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}

function RouteComponent() {
  const [password, setPassword] = useState<string>("");
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });
  const [strength, setStrength] = useState<{
    score: number;
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }>({
    score: 0,
    label: "Very Weak",
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "Password is too weak and easily crackable",
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(true);

  const generatePassword = () => {
    let charset = "";
    let password = "";

    // Build character set based on options
    if (options.includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (options.includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (options.includeNumbers) charset += "0123456789";
    if (options.includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    // Exclude similar characters if option is enabled
    if (options.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, "");
    }

    // Exclude ambiguous characters if option is enabled
    if (options.excludeAmbiguous) {
      charset = charset.replace(/[{}[\]()\/\\\'"`~,;:.<>]/g, "");
    }

    // Check if we have at least one character type selected
    if (charset.length === 0) {
      setPassword("");
      return;
    }

    // Ensure at least one character from each selected type
    const requiredChars: string[] = [];
    if (options.includeLowercase && charset.match(/[a-z]/)) {
      requiredChars.push(charset.match(/[a-z]/)![0]);
    }
    if (options.includeUppercase && charset.match(/[A-Z]/)) {
      requiredChars.push(charset.match(/[A-Z]/)![0]);
    }
    if (options.includeNumbers && charset.match(/[0-9]/)) {
      requiredChars.push(charset.match(/[0-9]/)![0]);
    }
    if (
      options.includeSymbols &&
      charset.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
    ) {
      requiredChars.push(charset.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/)![0]);
    }

    // Generate password with exact length
    password = "";
    const remainingLength = options.length - requiredChars.length;

    // Add required characters first
    for (const char of requiredChars) {
      password += char;
    }

    // Fill remaining length with random characters
    for (let i = 0; i < remainingLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    // Shuffle the password to ensure randomness
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    // Ensure the password is exactly the requested length
    password = password.substring(0, options.length);

    setPassword(password);
  };

  const calculateStrength = (pass: string) => {
    let score = 0;

    // Length scoring
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (pass.length >= 16) score += 1;
    if (pass.length >= 20) score += 1;

    // Character variety scoring
    if (/[a-z]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    // Bonus for mixed case and numbers
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[a-zA-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;

    // Penalty for patterns
    if (/(.)\1{2,}/.test(pass)) score -= 1; // Repeated characters
    if (/123|abc|qwe|asd|zxc/i.test(pass)) score -= 1; // Common patterns

    score = Math.max(0, Math.min(10, score));

    let strengthInfo;
    if (score <= 2) {
      strengthInfo = {
        label: "Very Weak",
        color: "text-red-600",
        bgColor: "bg-red-100",
        description: "Password is too weak and easily crackable",
      };
    } else if (score <= 4) {
      strengthInfo = {
        label: "Weak",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        description: "Password is weak and can be cracked quickly",
      };
    } else if (score <= 6) {
      strengthInfo = {
        label: "Fair",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        description: "Password is moderately secure",
      };
    } else if (score <= 8) {
      strengthInfo = {
        label: "Strong",
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "Password is strong and secure",
      };
    } else {
      strengthInfo = {
        label: "Very Strong",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        description: "Password is very strong and highly secure",
      };
    }

    setStrength({ score, ...strengthInfo });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generatePassphrase = () => {
    const words = [
      "apple",
      "banana",
      "cherry",
      "dragon",
      "eagle",
      "forest",
      "garden",
      "house",
      "island",
      "jungle",
      "knight",
      "lemon",
      "mountain",
      "ocean",
      "planet",
      "queen",
      "river",
      "star",
      "tiger",
      "umbrella",
      "village",
      "water",
      "xylophone",
      "yellow",
    ];

    let passphrase = "";
    const wordCount = Math.max(3, Math.floor(options.length / 8)); // Adjust word count based on desired length

    for (let i = 0; i < wordCount; i++) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      passphrase += (i === 0 ? "" : "-") + randomWord;
    }

    // If passphrase is too long, truncate it
    if (passphrase.length > options.length) {
      passphrase = passphrase.substring(0, options.length);
    }

    setPassword(passphrase);
  };

  useEffect(() => {
    if (password) {
      calculateStrength(password);
    }
  }, [password]);

  useEffect(() => {
    // Ensure at least one character type is selected
    if (
      options.includeLowercase ||
      options.includeUppercase ||
      options.includeNumbers ||
      options.includeSymbols
    ) {
      generatePassword();
    } else {
      setPassword("");
    }
  }, [options]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Password Generator - Utility Hub",
    description:
      "Generate strong, secure passwords with customizable options including length, character types, and exclusions. Ideal for enhancing your online security.",
    url: "https://utility.ethioar.app/password-generator",
    applicationCategory: "Tool",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Customizable password length (8-64 characters)",
      "Options to include/exclude uppercase, lowercase, numbers, and symbols",
      "Exclude similar characters (i, l, 1, L, o, 0, O)",
      "Exclude ambiguous characters ({ } [ ] ( ) / \\ ' \" ` ~ , ; : . < >)",
      "Real-time password strength assessment",
      "Generate memorable passphrases",
      "One-click copy to clipboard",
      "Password security tips and best practices",
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
        <title>Password Generator- Utility Hub</title>
        <meta
          name="description"
          content="Password Generator: Generate strong, secure passwords with customizable options including length, character types, and exclusions. Ideal for enhancing your online security."
        />
        <meta
          name="keywords"
          content="password generator, secure password, strong password, password strength, password options, customizable password, password creation, password tool, online password generator"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Password Generator" />
        <meta
          property="og:description"
          content="Password Generator: Generate strong, secure passwords with customizable options including length, character types, and exclusions. Ideal for enhancing your online security."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/password-generator"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Password Generator" />
        <meta
          name="twitter:description"
          content="Password Generator: Generate strong, secure passwords with customizable options including length, character types, and exclusions. Ideal for enhancing your online security."
        />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/password-generator"
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Password Generator
          </h1>
          <p className="text-gray-600">
            Generate strong, secure passwords with customizable options
          </p>
        </div>

        {/* Generated Password Display */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Generated Password
          </h2>
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                readOnly
                className="w-full px-4 py-3 text-lg font-mono border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={copyToClipboard}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Password Strength Indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Password Strength:
              </span>
              <span className={`text-sm font-medium ${strength.color}`}>
                {strength.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  strength.score <= 2
                    ? "bg-red-500"
                    : strength.score <= 4
                      ? "bg-orange-500"
                      : strength.score <= 6
                        ? "bg-yellow-500"
                        : strength.score <= 8
                          ? "bg-green-500"
                          : "bg-emerald-500"
                }`}
                style={{ width: `${(strength.score / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{strength.description}</p>
          </div>
        </div>

        {/* Password Options */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Password Options
          </h2>

          {/* Length Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Password Length: {options.length}
              </label>
              <span className="text-sm text-gray-500 font-mono">
                {options.length} characters
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={options.length}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  length: Number(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>8</span>
              <span>16</span>
              <span>24</span>
              <span>32</span>
              <span>48</span>
              <span>64</span>
            </div>
          </div>

          {/* Character Type Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeUppercase: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Uppercase Letters (A-Z)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeLowercase: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Lowercase Letters (a-z)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeNumbers: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Numbers (0-9)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeSymbols: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Symbols (!@#$%^&*)
                </span>
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.excludeSimilar}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      excludeSimilar: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Exclude Similar (i, l, 1, L, o, 0, O)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      excludeAmbiguous: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Exclude Ambiguous (&#123; &#125; &#91; &#93; &#40; &#41; / \
                  &#39; &quot; ` ~ , ; : . &lt; &gt;)
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generatePassword}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Generate New Password
            </button>
            <button
              onClick={generatePassphrase}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Generate Passphrase
            </button>
          </div>
        </div>

        {/* Password Security Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Password Security Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">
                Strong Password Features:
              </h4>
              <ul className="space-y-1">
                <li>• At least 12 characters long</li>
                <li>• Mix of uppercase and lowercase letters</li>
                <li>• Include numbers and symbols</li>
                <li>• Avoid common words or patterns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">
                Security Best Practices:
              </h4>
              <ul className="space-y-1">
                <li>• Use unique passwords for each account</li>
                <li>• Change passwords regularly</li>
                <li>• Enable two-factor authentication</li>
                <li>• Use a password manager</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            How it works
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              • <strong>Length Control:</strong> Adjust password length from 8
              to 64 characters
            </p>
            <p>
              • <strong>Character Types:</strong> Choose which character sets to
              include
            </p>
            <p>
              • <strong>Exclusion Options:</strong> Remove similar or ambiguous
              characters
            </p>
            <p>
              • <strong>Strength Analysis:</strong> Real-time password strength
              assessment
            </p>
            <p>
              • <strong>Passphrase Option:</strong> Generate memorable
              word-based passwords
            </p>
            <p>
              • <strong>Copy Function:</strong> Easy one-click copying to
              clipboard
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
