export type VCardFields = {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  note: string;
};

// vCard 3.0 text values must escape backslashes, commas, semicolons and newlines
function escapeValue(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

export function buildVCard(v: VCardFields) {
  const e = escapeValue;
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${e(v.lastName)};${e(v.firstName)};;;`,
    `FN:${e([v.firstName, v.lastName].filter(Boolean).join(" "))}`,
    v.organization ? `ORG:${e(v.organization)}` : "",
    v.title ? `TITLE:${e(v.title)}` : "",
    v.phone ? `TEL;TYPE=CELL:${v.phone}` : "",
    v.email ? `EMAIL;TYPE=INTERNET:${v.email}` : "",
    v.website ? `URL:${v.website}` : "",
    v.address ? `ADR:;;${e(v.address)};;;;` : "",
    v.note ? `NOTE:${e(v.note)}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}
