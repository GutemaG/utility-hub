import { createFileRoute } from "@tanstack/react-router";
import { useSEO } from "@/hooks/use-seo";
import { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const Route = createFileRoute("/cheat-sheets")({
  component: RouteComponent,
});

interface CheatItem {
  command: string;
  description: string;
}

function RouteComponent() {
  const [jumpSearch, setJumpSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const quickJumpRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sectionOptions = [
    { label: "Git", id: "git" },
    { label: "Vim", id: "vim" },
    { label: "Tmux", id: "tmux" },
    { label: "VS Code Shortcuts", id: "vscode-shortcuts" },
    { label: "TODO Roadmap", id: "todo-roadmap" },
  ];

  const jumpToSection = (sectionId: string) => {
    if (!sectionId) {
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    const panelBottom = quickJumpRef.current?.getBoundingClientRect().bottom ?? 110;
    const topOffset = Math.max(110, Math.round(panelBottom + 16));
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, targetTop - topOffset),
      behavior: "smooth",
    });
    window.history.replaceState(null, "", `#${sectionId}`);
  };

  const filteredOptions = useMemo(() => {
    const query = jumpSearch.trim().toLowerCase();
    if (!query) {
      return sectionOptions;
    }

    // If query is already an exact selected label, keep full list visible for easy re-selection.
    if (sectionOptions.some((option) => option.label.toLowerCase() === query)) {
      return sectionOptions;
    }

    return sectionOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [jumpSearch]);

  const handleSelectOption = (option: { id: string; label: string }) => {
    setJumpSearch(option.label);
    setShowSuggestions(false);
    jumpToSection(option.id);
  };

  const handleJumpSubmit = () => {
    const query = jumpSearch.trim().toLowerCase();
    if (!query) {
      return;
    }

    const bestMatch =
      sectionOptions.find((option) => option.label.toLowerCase() === query) ??
      sectionOptions.find((option) => option.label.toLowerCase().includes(query));

    if (bestMatch) {
      handleSelectOption(bestMatch);
    }
  };

  useSEO({
    title: "Cheat Sheets | Utility Hub",
    description:
      "Quick command references for Git, Vim, Tmux, and VS Code keyboard shortcuts, with roadmap TODOs for more developer cheat sheets.",
    path: "/cheat-sheets",
    keywords:
      "cheat sheets, git cheat sheet, vim cheat sheet, tmux cheat sheet, vscode shortcuts",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Git quick commands",
      "Vim navigation and editing",
      "Tmux session controls",
      "VS Code keyboard shortcuts",
      "Cheat sheet roadmap",
    ],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Developer Cheat Sheets</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Fast reference for common commands and shortcuts. Start with the navigation below.
        </p>
      </div>

      <section
        ref={quickJumpRef}
        className="fixed top-20 left-4 right-4 z-40 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:left-auto sm:right-4 sm:w-[320px]"
      >
        <h2 className="text-sm font-semibold text-foreground">Quick Jump</h2>
        <div className="relative mt-2">
          <Input
            ref={inputRef}
            value={jumpSearch}
            placeholder="Search section: Git, Vim, Tmux..."
            className="pr-9"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              window.setTimeout(() => setShowSuggestions(false), 120);
            }}
            onChange={(event) => {
              setJumpSearch(event.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleJumpSubmit();
              }
            }}
          />

          {jumpSearch ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                setJumpSearch("");
                setShowSuggestions(true);
                inputRef.current?.focus();
              }}
              aria-label="Clear quick jump search"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}

          {showSuggestions ? (
            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start px-2 py-1.5 text-left text-sm text-popover-foreground"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelectOption(option);
                    }}
                  >
                    {option.label}
                  </Button>
                ))
              ) : (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">No matching section</p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Cheat Sheet Navigation</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Git", href: "#git" },
            { label: "Vim", href: "#vim" },
            { label: "Tmux", href: "#tmux" },
            { label: "VS Code Shortcuts", href: "#vscode-shortcuts" },
            { label: "TODO Roadmap", href: "#todo-roadmap" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-muted"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      <CheatSection
        id="git"
        title="Git"
        items={[
          { command: "git status", description: "Show current working tree state." },
          { command: "git add .", description: "Stage all modified/new files." },
          { command: "git commit -m \"message\"", description: "Create a commit with a message." },
          { command: "git pull --rebase", description: "Update branch while keeping linear history." },
          { command: "git push", description: "Push local commits to remote." },
          { command: "git checkout -b feature/name", description: "Create and switch to a new branch." },
          { command: "git log --oneline --graph --decorate -20", description: "Compact visual commit history." },
          { command: "git stash -u", description: "Temporarily save working changes including untracked files." },
        ]}
      />

      <CheatSection
        id="vim"
        title="Vim"
        items={[
          { command: "i", description: "Insert before cursor." },
          { command: "Esc", description: "Return to normal mode." },
          { command: ":w", description: "Save file." },
          { command: ":q", description: "Quit." },
          { command: ":wq", description: "Save and quit." },
          { command: ":q!", description: "Quit without saving." },
          { command: "dd", description: "Delete current line." },
          { command: "yy", description: "Yank (copy) current line." },
          { command: "p", description: "Paste after cursor." },
          { command: "/pattern", description: "Search forward for pattern." },
        ]}
      />

      <CheatSection
        id="tmux"
        title="Tmux"
        items={[
          { command: "tmux", description: "Start new tmux session." },
          { command: "tmux new -s work", description: "Start named session." },
          { command: "tmux ls", description: "List sessions." },
          { command: "tmux attach -t work", description: "Attach to named session." },
          { command: "Ctrl+b d", description: "Detach from session." },
          { command: "Ctrl+b c", description: "Create new window." },
          { command: "Ctrl+b ,", description: "Rename current window." },
          { command: "Ctrl+b %", description: "Split pane vertically." },
          { command: "Ctrl+b \"", description: "Split pane horizontally." },
          { command: "Ctrl+b arrow", description: "Move between panes." },
        ]}
      />

      <CheatSection
        id="vscode-shortcuts"
        title="Keyboard Shortcuts (VS Code)"
        items={[
          { command: "Ctrl+P", description: "Quick open files." },
          { command: "Ctrl+Shift+P", description: "Command palette." },
          { command: "Ctrl+`", description: "Toggle terminal." },
          { command: "Ctrl+K Ctrl+S", description: "Open keyboard shortcuts." },
          { command: "Ctrl+Shift+F", description: "Search across files." },
          { command: "Ctrl+D", description: "Add next match to multi-cursor." },
          { command: "Alt+Up/Down", description: "Move line up or down." },
          { command: "Shift+Alt+F", description: "Format document." },
          { command: "F2", description: "Rename symbol." },
          { command: "Ctrl+K Z", description: "Zen mode." },
        ]}
      />

      <section id="todo-roadmap" className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">TODO Roadmap</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Planned cheat sheets listed by priority. These are not implemented yet.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-foreground">
          <li>[ ] Regex</li>
          <li>[ ] Bash</li>
          <li>[ ] PowerShell</li>
          <li>[ ] npm</li>
          <li>[ ] Docker</li>
          <li>[ ] LaTeX</li>
          <li>[ ] Nix</li>
          <li>[ ] Emmet</li>
          <li>[ ] Emacs</li>
          <li>[ ] GitHub Actions</li>
          <li>[ ] GitHub CLI</li>
          <li>[ ] grep</li>
          <li>[ ] cron</li>
          <li>[ ] SSH</li>
          <li>[ ] curl</li>
          <li>[ ] Keyboard Shortcuts for other IDEs (IntelliJ, WebStorm, Neovim, Android Studio)</li>
        </ul>
      </section>
    </div>
  );
}

function CheatSection({ id, title, items }: { id: string; title: string; items: CheatItem[] }) {
  return (
    <section id={id} className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 font-semibold text-foreground">Command / Shortcut</th>
              <th className="py-2 font-semibold text-foreground">What it does</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${id}-${item.command}`} className="border-b border-border/70 align-top">
                <td className="py-2 pr-4 font-mono text-xs text-blue-600 sm:text-sm">{item.command}</td>
                <td className="py-2 text-muted-foreground">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
