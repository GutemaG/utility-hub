import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { v1, v3, v4, v5 } from "uuid";

export const Route = createFileRoute("/uuid-generator")({
  component: RouteComponent,
});

function RouteComponent() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [version, setVersion] = useState<string>("v4");
  const [namespace, setNamespace] = useState<string>(
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
  ); // DNS namespace by default
  const [isNamespaceValid, setIsNamespaceValid] = useState<boolean>(true);
  const [count, setCount] = useState<number>(1);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Predefined namespaces for quick selection
  const predefinedNamespaces = [
    { value: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", label: "DNS" },
    { value: "6ba7b811-9dad-11d1-80b4-00c04fd430c8", label: "URL" },
    { value: "6ba7b812-9dad-11d1-80b4-00c04fd430c8", label: "OID" },
    { value: "6ba7b814-9dad-11d1-80b4-00c04fd430c8", label: "X.500" },
  ];

  // UUID validation function
  const isValidUUID = (str: string): boolean => {
    if (!str) return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Handle namespace selection from predefined options
  const handleNamespaceSelect = (value: string) => {
    setNamespace(value);
    setIsNamespaceValid(true); // Predefined namespaces are always valid
  };

  // Handle namespace input change (manual editing)
  const handleNamespaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNamespace(value);

    // Validate the UUID format
    const valid = isValidUUID(value);
    setIsNamespaceValid(valid);
  };

  // Safe UUID generation function for v3 and v5
  const generateV3OrV5UUID = (
    name: string,
    namespaceUUID: string,
    version: "v3" | "v5"
  ): string | null => {
    try {
      if (!isValidUUID(namespaceUUID)) {
        return null;
      }

      if (version === "v3") {
        return v3(name, namespaceUUID);
      } else {
        return v5(name, namespaceUUID);
      }
    } catch (error) {
      console.error("Error generating UUID:", error);
      return null;
    }
  };

  // Generate UUIDs based on selected version and count
  const generateUUIDs = () => {
    // Don't generate if we have an invalid namespace for v3/v5
    if ((version === "v3" || version === "v5") && !isNamespaceValid) {
      setUuids([]); // Clear existing UUIDs
      return;
    }

    const newUUIDs: string[] = [];

    for (let i = 0; i < count; i++) {
      let uuid: string | null = null;

      switch (version) {
        case "nil": {
          uuid = "00000000-0000-0000-0000-000000000000";
          break;
        }
        case "v1": {
          uuid = v1({
            // Use different clock sequence for each UUID to ensure uniqueness
            clockseq: Math.floor(Math.random() * 16384),
            // Add a small msecs offset for each UUID
            msecs: Date.now() - (count - i) * 10,
          });
          break;
        }
        case "v3": {
          const nameV3 = `uuid-${i}-${Date.now()}`;
          uuid = generateV3OrV5UUID(nameV3, namespace, "v3");
          // Fallback if generation fails
          if (uuid === null) {
            uuid = "INVALID-NAMESPACE-ERROR-FOR-V3";
          }
          break;
        }
        case "v4": {
          uuid = v4();
          break;
        }
        case "v5": {
          const nameV5 = `uuid-${i}-${Date.now()}`;
          uuid = generateV3OrV5UUID(nameV5, namespace, "v5");
          // Fallback if generation fails
          if (uuid === null) {
            uuid = "INVALID-NAMESPACE-ERROR-FOR-V5";
          }
          break;
        }
        default: {
          uuid = v4();
          break;
        }
      }

      if (uuid !== null) {
        newUUIDs.push(uuid);
      }
    }

    setUuids(newUUIDs);
  };

  // Copy all UUIDs to clipboard
  const copyAllToClipboard = async () => {
    try {
      const allUuids = uuids.join("\n");
      await navigator.clipboard.writeText(allUuids);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = uuids.join("\n");
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  // Regenerate UUIDs when version or namespace changes
  useEffect(() => {
    generateUUIDs();
  }, [version, namespace, count, isNamespaceValid]);

  // Generate initial UUIDs when component mounts
  useEffect(() => {
    generateUUIDs();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "UUID Generator - Utility Hub",
    description:
      "Generate universally unique identifiers (UUID/GUID) in various versions (nil, v1, v3, v4, v5). Create multiple UUIDs at once with a simple, compact interface.",
    url: "https://utility.ethioar.app/uuid-generator",
    applicationCategory: "Tool",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
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
  }, []);

  return (
    <>
      <div style={{ display: "none" }}>
        <title>UUID Generator - Utility Hub</title>
        <meta
          name="description"
          content="Simple UUID Generator: Create universally unique identifiers in various versions. Generate and copy multiple UUIDs with a clean, compact interface."
        />
        <meta
          name="keywords"
          content="uuid generator, guid generator, uuid, guid, unique identifier, uuid v4, generate uuid, copy uuid"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/uuid-generator"
        />
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            UUID Generator
          </h1>
          <p className="text-gray-600 text-sm">
            Generate unique identifiers in different versions
          </p>
        </div>

        {/* Compact Control Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Version Buttons */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                UUID Version:
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: "nil", label: "Nil" },
                  { value: "v1", label: "V1" },
                  { value: "v3", label: "V3" },
                  { value: "v4", label: "V4" },
                  { value: "v5", label: "V5" },
                ].map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setVersion(v.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      version === v.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Namespace Selector (only show for v3 and v5) */}
            {(version === "v3" || version === "v5") && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Namespace for {version.toUpperCase()}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {predefinedNamespaces.map((ns) => (
                    <button
                      key={ns.value}
                      onClick={() => handleNamespaceSelect(ns.value)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        namespace === ns.value
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {ns.label}
                    </button>
                  ))}
                </div>

                {/* Editable Namespace Input for all namespace types */}
                <div>
                  <div className="text-xs text-gray-600 mb-1">
                    Namespace UUID (editable):
                  </div>
                  <input
                    type="text"
                    value={namespace}
                    placeholder="Enter namespace UUID (e.g., 6ba7b810-9dad-11d1-80b4-00c04fd430c8)"
                    onChange={handleNamespaceChange}
                    className={`w-full px-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 ${
                      isNamespaceValid
                        ? "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        : "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50"
                    }`}
                  />
                  {!isNamespaceValid && (
                    <p className="mt-1 text-xs text-red-600">
                      Invalid UUID format. Please use format: 8-4-4-4-12
                      hexadecimal digits (e.g.,
                      6ba7b810-9dad-11d1-80b4-00c04fd430c8)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Full-width Quantity Input & Generate Button */}
            <div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 sm:pt-0 sm:border-t-0">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Quantity:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={count}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setCount(Math.max(1, Math.min(100, val)));
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter number of UUIDs (1-100)"
                    />
                    <button
                      onClick={generateUUIDs}
                      disabled={
                        (version === "v3" || version === "v5") &&
                        !isNamespaceValid
                      }
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        (version === "v3" || version === "v5") &&
                        !isNamespaceValid
                          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                {/* Generate Button */}
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {uuids.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {uuids.length} UUID{uuids.length !== 1 ? "s" : ""} Generated
              </h3>
              <button
                onClick={copyAllToClipboard}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  copiedAll
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copiedAll ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* UUID Text Area */}
            <textarea
              value={uuids.join("\n")}
              readOnly
              rows={Math.min(10, Math.max(5, uuids.length))}
              className="w-full text-xs sm:text-sm font-mono p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Generated UUIDs will appear here..."
            />
          </div>
        )}

        {/* Mini Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Click a version button to instantly refresh. Use "Generate" to
            create UUIDs with your current settings.
          </p>
        </div>
      </div>
    </>
  );
}
