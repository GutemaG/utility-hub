import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/clipboard";

export function SecretField({
  value,
  onChange,
  isBase64Url,
  onToggleBase64Url,
  placeholder = "your-256-bit-secret",
}: {
  value: string;
  onChange: (value: string) => void;
  isBase64Url: boolean;
  onToggleBase64Url: (checked: boolean) => void;
  placeholder?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    const didCopy = await copyText(value);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground">Secret</label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Base64url encoded
          <Switch checked={isBase64Url} onCheckedChange={onToggleBase64Url} />
        </label>
      </div>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="min-h-16 pr-16 font-mono text-sm"
        />
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={!value}
            onClick={handleCopy}
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            <span className="sr-only">Copy secret</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={!value}
            onClick={() => onChange("")}
          >
            <X className="size-3.5" />
            <span className="sr-only">Clear secret</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
