export interface CheatItem {
  command: string;
  description: string;
  /** Optional concrete usage example, shown in an info-icon tooltip. */
  example?: string;
}

export interface CheatSubsection {
  title?: string;
  items: CheatItem[];
}

export interface CheatSheet {
  id: string;
  title: string;
  category: string;
  sections: CheatSubsection[];
}

export const CHEAT_CATEGORIES = [
  "Version Control",
  "Editors",
  "Shell & Terminal",
  "Web Dev",
  "DevOps",
  "Docs",
  "Databases & SQL",

] as const;

/** Convenience for sheets that don't (yet) have a sub-section breakdown. */
function flat(items: CheatItem[]): CheatSubsection[] {
  return [{ items }];
}

export const CHEAT_SHEETS: CheatSheet[] = [
  // ---------------------------------------------------------------------
  // Version Control
  // ---------------------------------------------------------------------
  {
    id: "git",
    title: "Git",
    category: "Version Control",
    sections: [
      {
        title: "Setup & Config",
        items: [
          { command: "git init", description: "Initialize a new repository.", example: "Creates a .git/ folder in the current directory." },
          { command: "git clone url", description: "Clone a remote repository.", example: "git clone https://github.com/user/repo.git" },
          { command: 'git config --global user.name "Name"', description: "Set your global username.", example: 'git config --global user.name "Jane Doe"' },
          { command: 'git config --global user.email "email"', description: "Set your global email.", example: 'git config --global user.email "jane@example.com"' },
          { command: 'git config --global core.editor "code --wait"', description: "Set your default editor.", example: "Opens VS Code and waits for the tab to close before continuing." },
        ],
      },
      {
        title: "Stage & Commit",
        items: [
          { command: "git status", description: "Show current working tree state.", example: "Lists files like 'modified: src/app.js' before you stage them." },
          { command: "git add file", description: "Stage a specific file.", example: "git add src/app.js" },
          { command: "git add .", description: "Stage all modified/new files.", example: "Stages every change in the current directory and below." },
          { command: "git add -p", description: "Interactively stage hunks of a file.", example: "Prompts y/n/s per hunk so you can commit only part of a file's changes." },
          { command: 'git commit -m "message"', description: "Commit staged changes with a message.", example: 'git commit -m "Fix login redirect bug"' },
          { command: "git commit --amend", description: "Amend the most recent commit.", example: "Only amend commits you haven't pushed yet — it rewrites history." },
        ],
      },
      {
        title: "Branches",
        items: [
          { command: "git branch", description: "List local branches.", example: "Prints '* main' — the asterisk marks your current branch." },
          { command: "git branch name", description: "Create a new branch.", example: "git branch feature-login" },
          { command: "git checkout -b feature/name", description: "Create and switch to a new branch.", example: "git checkout -b feature/login-page" },
          { command: "git switch -c name", description: "Create and switch to a branch (modern syntax).", example: "git switch -c feature/login-page" },
          { command: "git branch -d name", description: "Delete a branch that's already merged.", example: "git branch -d feature-login" },
          { command: "git branch -D name", description: "Force-delete a branch.", example: "Use when -d refuses due to unmerged commits — you'll lose them." },
        ],
      },
      {
        title: "Inspect & Compare",
        items: [
          { command: "git diff", description: "Show unstaged changes since the last commit.", example: "Shows +/- line changes for files you haven't run 'git add' on yet." },
          { command: "git diff --staged", description: "Show staged changes since the last commit.", example: "Shows exactly what the next commit will contain." },
          { command: "git log --oneline --graph --decorate -20", description: "Compact visual commit history.", example: "Prints the last 20 commits as an ASCII graph with branch/tag labels." },
          { command: "git show <hash>", description: "Show a specific commit's changes.", example: "git show a1b2c3d" },
          { command: "git blame file", description: "Show who last changed each line of a file.", example: "git blame src/app.js — prints the commit hash and author per line." },
        ],
      },
      {
        title: "Merge & Rebase",
        items: [
          { command: "git merge branch", description: "Merge a branch into the current one.", example: "From main: git merge feature-login" },
          { command: "git merge --no-ff branch", description: "Merge a branch, always creating a merge commit.", example: "Keeps a visible 'merged branch X' commit even when fast-forward is possible." },
          { command: "git rebase branch", description: "Replay current branch's commits onto another branch.", example: "git rebase main — replays your commits on top of main's latest commit." },
          { command: "git rebase -i HEAD~3", description: "Interactively edit/squash the last 3 commits.", example: "Opens an editor listing 3 commits to pick/squash/reword." },
          { command: "git cherry-pick <hash>", description: "Apply a specific commit onto the current branch.", example: "git cherry-pick a1b2c3d — applies just that one commit here." },
        ],
      },
      {
        title: "Sync with Remotes",
        items: [
          { command: "git remote -v", description: "List configured remotes.", example: "Prints 'origin  https://github.com/user/repo.git (fetch/push)'." },
          { command: "git fetch", description: "Download objects/refs without merging.", example: "Updates origin/main locally without touching your working branch." },
          { command: "git pull --rebase", description: "Update branch while keeping linear history.", example: "Equivalent to git fetch followed by git rebase origin/main." },
          { command: "git push", description: "Push local commits to remote.", example: "Fails with 'no upstream branch' the first time — see git push -u." },
          { command: "git push -u origin branch", description: "Push and set the upstream tracking branch.", example: "git push -u origin feature-login — later pushes just need 'git push'." },
        ],
      },
      {
        title: "Undo & Recover",
        items: [
          { command: "git restore file", description: "Discard unstaged changes to a file.", example: "git restore src/app.js — reverts it to the last committed version." },
          { command: "git restore --staged file", description: "Unstage a file, keeping its changes.", example: "git restore --staged src/app.js — keeps edits, just unstages them." },
          { command: "git reset --soft HEAD~1", description: "Undo the last commit, keep changes staged.", example: "Lets you re-commit the same changes differently." },
          { command: "git reset --hard HEAD~1", description: "Discard the last commit and all its changes.", example: "Destructive — permanently drops those changes; use git reflog to recover." },
          { command: "git reflog", description: "Show where HEAD has been — recover 'lost' commits.", example: "Shows entries 'git log' can't see, e.g. after a bad reset." },
        ],
      },
      {
        title: "Stash",
        items: [
          { command: "git stash", description: "Stash working changes.", example: "Shelves your edits and gives you a clean working tree." },
          { command: "git stash -u", description: "Stash working changes, including untracked files.", example: "Also stashes new files you haven't run 'git add' on yet." },
          { command: "git stash list", description: "List all stashes.", example: "Prints 'stash@{0}: WIP on main: ...'." },
          { command: "git stash pop", description: "Apply and remove the latest stash.", example: "Restores stash@{0} and removes it from the list." },
          { command: "git stash drop", description: "Delete a stash without applying it.", example: "git stash drop stash@{0}" },
        ],
      },
      {
        title: "Tags",
        items: [
          { command: "git tag v1.0.0", description: "Create a lightweight tag at the current commit.", example: "Tags the current commit; doesn't push automatically." },
          { command: 'git tag -a v1.0.0 -m "message"', description: "Create an annotated tag.", example: 'git tag -a v1.0.0 -m "First stable release"' },
          { command: "git push --tags", description: "Push all local tags to the remote.", example: "Pushes every local tag that isn't already on the remote." },
        ],
      },

      {
        title: "Rebasing & History Modification",
        items: [
          { command: "git rebase -i HEAD~<N>", description: "Interactively edit, squash, reword, or drop past commits.", example: "git rebase -i HEAD~3" },
          { command: "git cherry-pick <commit_hash>", description: "Apply an existing commit from another branch to current branch.", example: "git cherry-pick a1b2c3d" },
          { command: "git commit --amend --no-edit", description: "Add staged changes to the previous commit without changing commit message.", example: "git add . && git commit --amend --no-edit" }
        ]
      },
      {
        title: "History Search & Recovery",
        items: [
          { command: "git reflog", description: "Show local history of all HEAD movements (great for recovering lost commits).", example: "git reflog" },
          { command: "git reset --hard <commit>", description: "Reset HEAD, staging index, and working directory to a state.", example: "git reset --hard HEAD@{1}" },
          { command: "git bisect start", description: "Use binary search to find which commit introduced a bug.", example: "git bisect start\ngit bisect bad HEAD\ngit bisect good v1.0.0" },
          { command: "git log -S \"search_term\"", description: "Search commit history for specific code addition or deletion.", example: 'git log -S "SECRET_KEY"' }
        ]
      }
    ],
  },
  {
    id: "github-cli",
    title: "GitHub CLI",
    category: "Version Control",
    sections: flat([
      { command: "gh auth login", description: "Authenticate the CLI with your GitHub account." },
      { command: "gh repo clone owner/repo", description: "Clone a repository." },
      { command: "gh repo create", description: "Create a new repository from the CLI." },
      { command: "gh pr create", description: "Open a pull request for the current branch." },
      { command: "gh pr list", description: "List open pull requests." },
      { command: "gh pr view 123 --web", description: "Open pull request #123 in the browser." },
      { command: "gh pr checkout 123", description: "Check out a pull request's branch locally." },
      { command: "gh pr merge --squash", description: "Squash-merge the current pull request." },
      { command: "gh issue list", description: "List open issues." },
      { command: "gh issue create", description: "Create a new issue." },
      { command: "gh run list", description: "List recent GitHub Actions workflow runs." },
      { command: "gh run watch", description: "Watch a running workflow live in the terminal." },
      { command: "gh api repos/:owner/:repo", description: "Call the GitHub REST API directly." },
    ]),
  },
  {
    id: "github-actions",
    title: "GitHub Actions",
    category: "Version Control",
    sections: flat([
      { command: "on: [push, pull_request]", description: "Events that trigger the workflow." },
      { command: "jobs.<id>.runs-on: ubuntu-latest", description: "Specify the runner operating system." },
      { command: "- uses: actions/checkout@v4", description: "Check out the repository in a job." },
      { command: "- run: npm test", description: "Run a shell command as a step." },
      { command: "env:", description: "Set environment variables for a job or step." },
      { command: "${{ secrets.NAME }}", description: "Reference an encrypted repository/organization secret." },
      { command: "needs: [build]", description: "Make a job wait on another job's completion." },
      { command: "strategy.matrix", description: "Run a job across multiple config combinations." },
      { command: "workflow_dispatch:", description: "Allow manually triggering the workflow from the UI." },
      { command: "- uses: actions/cache@v4", description: "Cache dependencies between workflow runs." },
      { command: "if: github.ref == 'refs/heads/main'", description: "Conditionally run a step or job." },
      { command: "${{ github.event_name }}", description: "Access metadata about the triggering event." },
    ]),
  },

  // ---------------------------------------------------------------------
  // Editors
  // ---------------------------------------------------------------------
  {
    id: "vim",
    title: "Vim",
    category: "Editors",
    sections: [
      {
        title: "Global",
        items: [
          { command: ":h[elp] keyword", description: "Open help for keyword." },
          { command: ":sav[eas] file", description: "Save file as." },
          { command: ":clo[se]", description: "Close current pane." },
          { command: ":ter[minal]", description: "Open a terminal window." },
          { command: "K", description: "Open man page for word under the cursor." },
        ],
      },
      {
        title: "Cursor Movement",
        items: [
          { command: "h", description: "Move cursor left." },
          { command: "j", description: "Move cursor down." },
          { command: "k", description: "Move cursor up." },
          { command: "l", description: "Move cursor right." },
          { command: "gj / gk", description: "Move cursor down/up (multi-line text)." },
          { command: "H / M / L", description: "Move to top / middle / bottom of screen." },
          { command: "w", description: "Jump forwards to the start of a word." },
          { command: "W", description: "Jump forwards to a WORD (space-delimited)." },
          { command: "e / E", description: "Jump forwards to the end of a word / WORD." },
          { command: "b", description: "Jump backwards to the start of a word." },
          { command: "ge", description: "Jump backwards to the end of a word." },
          { command: "0", description: "Jump to the start of the line." },
          { command: "^", description: "Jump to the first non-blank character of the line." },
          { command: "$", description: "Jump to the end of the line." },
          { command: "g_", description: "Jump to the last non-blank character of the line." },
          { command: "gg", description: "Go to the first line of the document." },
          { command: "G", description: "Go to the last line of the document." },
          { command: "5G or :5", description: "Go to line 5." },
          { command: "fx", description: "Jump to the next occurrence of character x." },
          { command: "tx", description: "Jump to just before the next occurrence of x." },
          { command: "%", description: "Jump to the matching bracket." },
        ],
      },
      {
        title: "Insert Mode (Appending)",
        items: [
          { command: "i", description: "Insert before cursor." },
          { command: "I", description: "Insert at the beginning of the line." },
          { command: "a", description: "Append after cursor." },
          { command: "A", description: "Append at the end of the line." },
          { command: "o", description: "Open a new line below." },
          { command: "O", description: "Open a new line above." },
          { command: "ea", description: "Insert (append) at the end of the word." },
          { command: "Esc", description: "Return to normal mode." },
        ],
      },
      {
        title: "Editing",
        items: [
          { command: "r", description: "Replace a single character." },
          { command: "R", description: "Replace more than one character, until Esc is pressed." },
          { command: "J", description: "Join line below to the current one with one space." },
          { command: "gJ", description: "Join line below without space." },
          { command: "gwip", description: "Reflow (format) the current paragraph." },
          { command: "g~", description: "Switch case up to motion." },
          { command: "gu / gU", description: "Lowercase / uppercase up to motion." },
          { command: "cc", description: "Change (replace) the entire line." },
          { command: "c$ or C", description: "Change to the end of the line." },
          { command: "ciw", description: "Change the entire word under the cursor." },
          { command: "cw or ce", description: "Change to the end of the word." },
          { command: "s", description: "Delete character and substitute text (same as cl)." },
          { command: "S", description: "Delete line and substitute text (same as cc)." },
          { command: "xp", description: "Transpose two letters (delete and paste)." },
          { command: "u", description: "Undo." },
          { command: "U", description: "Restore (undo) the last changed line." },
          { command: "Ctrl+r", description: "Redo." },
          { command: ".", description: "Repeat the last change." },
        ],
      },
      {
        title: "Marking Text (Visual Mode)",
        items: [
          { command: "v", description: "Start visual mode." },
          { command: "V", description: "Start linewise visual mode." },
          { command: "Ctrl+v", description: "Start blockwise visual mode." },
          { command: "o", description: "Go to the other end of the marked area." },
          { command: "aw", description: "Mark a word." },
          { command: "ab / aB", description: "Mark a block delimited by () / {}." },
          { command: "ib / iB", description: "Mark the inner block delimited by () / {}." },
          { command: "Esc", description: "Exit visual mode." },
        ],
      },
      {
        title: "Visual Commands",
        items: [
          { command: ">", description: "Shift marked text right (indent)." },
          { command: "<", description: "Shift marked text left (de-indent)." },
          { command: "y", description: "Yank (copy) marked text." },
          { command: "d", description: "Delete marked text." },
          { command: "~", description: "Switch case of marked text." },
        ],
      },
      {
        title: "Registers",
        items: [
          { command: ":reg", description: "Show the contents of all registers." },
          { command: '"xy', description: "Yank into register x." },
          { command: '"xp', description: "Paste from register x." },
          { command: '"+y', description: "Yank into the system clipboard register." },
          { command: '"+p', description: "Paste from the system clipboard register." },
          { command: '"_d', description: "Delete into the black hole register (no overwrite)." },
        ],
      },
      {
        title: "Marks and Positions",
        items: [
          { command: ":marks", description: "List all marks." },
          { command: "ma", description: "Set mark a at the current position." },
          { command: "`a", description: "Jump to the exact position of mark a." },
          { command: "'a", description: "Jump to the line of mark a." },
          { command: "``", description: "Jump to the position before the last jump." },
          { command: "`.", description: "Jump to the position of the last change." },
        ],
      },
      {
        title: "Search and Replace",
        items: [
          { command: "/pattern", description: "Search forward for pattern." },
          { command: "?pattern", description: "Search backward for pattern." },
          { command: "n / N", description: "Repeat search in same / opposite direction." },
          { command: ":%s/old/new/g", description: "Replace all occurrences of old with new in the file." },
          { command: ":%s/old/new/gc", description: "Replace all occurrences, asking for confirmation." },
          { command: ":noh", description: "Remove search highlighting." },
        ],
      },
      {
        title: "Indent Text",
        items: [
          { command: ">>", description: "Indent the current line one shiftwidth." },
          { command: "<<", description: "De-indent the current line one shiftwidth." },
          { command: ">%", description: "Indent a block delimited by matching braces." },
          { command: "=", description: "Autoindent a motion." },
          { command: ":set autoindent", description: "Toggle autoindent on/off." },
        ],
      },
      {
        title: "Macros",
        items: [
          { command: "qa", description: "Record macro a." },
          { command: "q", description: "Stop recording the current macro." },
          { command: "@a", description: "Run macro a." },
          { command: "@@", description: "Rerun the last run macro." },
        ],
      },
      {
        title: "Cut and Paste",
        items: [
          { command: "yy", description: "Yank (copy) the current line." },
          { command: "2yy", description: "Yank 2 lines." },
          { command: "yw", description: "Yank from cursor to the start of the next word." },
          { command: "yiw", description: "Yank the word under the cursor." },
          { command: "yaw", description: "Yank the word under the cursor plus surrounding space." },
          { command: "y$ or Y", description: "Yank to the end of the line." },
          { command: "p", description: "Put (paste) after the cursor." },
          { command: "P", description: "Put (paste) before the cursor." },
          { command: "dd", description: "Delete (cut) the current line." },
          { command: "2dd", description: "Delete (cut) 2 lines." },
          { command: "dw", description: "Delete from cursor to the start of the next word." },
        ],
      },
      {
        title: "Tabs",
        items: [
          { command: ":tabnew", description: "Open a new tab." },
          { command: "Ctrl+w T", description: "Move the current split into its own tab." },
          { command: "gt / :tabn", description: "Go to the next tab." },
          { command: "gT / :tabp", description: "Go to the previous tab." },
          { command: "#gt", description: "Go to tab number #." },
          { command: ":tabmove #", description: "Move the current tab to position #." },
          { command: ":tabclose", description: "Close the current tab." },
        ],
      },
      {
        title: "Diff (vimdiff)",
        items: [
          { command: "vimdiff file1 file2", description: "Compare two files side by side." },
          { command: "]c / [c", description: "Jump to the next / previous diff hunk." },
          { command: "do", description: "Obtain (diff-get) a change from the other file." },
          { command: "dp", description: "Put (diff-put) a change into the other file." },
          { command: ":diffupdate", description: "Re-scan the files for differences." },
          { command: "Ctrl+w w", description: "Switch to the other diff split." },
        ],
      },
      {
        title: "Working with Multiple Files",
        items: [
          { command: ":e file", description: "Edit another file in a new buffer." },
          { command: ":bnext / :bn", description: "Go to the next buffer." },
          { command: ":bprev / :bp", description: "Go to the previous buffer." },
          { command: ":bd", description: "Delete (close) a buffer." },
          { command: ":ls", description: "List all open buffers." },
          { command: ":sp file", description: "Split the window and edit a file." },
          { command: ":vsp file", description: "Split the window vertically and edit a file." },
          { command: "Ctrl+w w", description: "Switch between open windows." },
          { command: "Ctrl+w q", description: "Quit the current window." },
          { command: "Ctrl+w =", description: "Make all windows equal size." },
        ],
      },
    ],
  },
  {
    id: "neovim",
    title: "Neovim",
    category: "Editors",
    sections: flat([
      { command: "(all Vim commands)", description: "Neovim is Vim-compatible — see the Vim cheat sheet for core motions and editing." },
      { command: ":Lazy", description: "Open the lazy.nvim plugin manager UI." },
      { command: ":checkhealth", description: "Diagnose Neovim and plugin configuration issues." },
      { command: "gd", description: "Go to definition via the language server." },
      { command: "gr", description: "Show references via the language server." },
      { command: "K", description: "Show hover documentation via the language server." },
      { command: ":Mason", description: "Manage installed LSP servers, linters, and formatters." },
      { command: "<leader>", description: "User-defined prefix key for custom keymaps (often space)." },
      { command: ":Telescope find_files", description: "Fuzzy-find files with telescope.nvim." },
      { command: "]d / [d", description: "Jump to the next/previous diagnostic." },
      { command: ":terminal", description: "Open an embedded terminal split." },
    ]),
  },
  {
    id: "emacs",
    title: "Emacs",
    category: "Editors",
    sections: flat([
      { command: "C-x C-f", description: "Open (find) a file." },
      { command: "C-x C-s", description: "Save the current buffer." },
      { command: "C-x C-c", description: "Exit Emacs." },
      { command: "C-g", description: "Cancel the current command." },
      { command: "C-x b", description: "Switch to another buffer." },
      { command: "C-x k", description: "Kill (close) a buffer." },
      { command: "C-space", description: "Set the mark to start a selection (region)." },
      { command: "C-w / M-w", description: "Cut / copy the selected region." },
      { command: "C-y", description: "Yank (paste) the last kill." },
      { command: "C-s / C-r", description: "Incremental search forward / backward." },
      { command: "M-x command", description: "Run a named command by its full name." },
      { command: "C-x u", description: "Undo." },
      { command: "C-x 2 / C-x 3", description: "Split the window horizontally / vertically." },
      { command: "C-x o", description: "Move focus to the other window." },
    ]),
  },
  {
    id: "visual-studio-shortcuts",
    title: "Keyboard Shortcuts (VS Code)",
    category: "Editors",
    sections: [
      {
        title: "Code Editing",
        items: [
          { command: "Ctrl + Space", description: "Complete word." },
          { command: "Ctrl + Shift + Space", description: "Show signature help." },
          { command: "Alt + ↑ / ↓", description: "Move line up or down." },
          { command: "Ctrl + D", description: "Duplicate line." },
          { command: "Ctrl + Shift + L", description: "Delete line." },
          { command: "Ctrl + Enter", description: "Insert line below." },
          { command: "Ctrl + Shift + Enter", description: "Insert line above." },
          { command: "Ctrl + ↑ / ↓", description: "Scroll line up or down." },
          { command: "Ctrl + PgUp / PgDn", description: "Scroll page up or down." },
          { command: "Shift + Mouse Wheel", description: "Scroll page horizontally." },
          { command: "Ctrl + /", description: "Toggle line comment." },
          { command: "Ctrl + Shift + /", description: "Toggle block comment." },
          { command: "Ctrl + K, Ctrl + D", description: "Format document." },
          { command: "Ctrl + K, Ctrl + F", description: "Format selection." },
          { command: "Alt + /", description: "Ask Copilot (inline chat)." },
          { command: "Ctrl + E, W", description: "Toggle word wrap." },
          { command: "Ctrl + R, W", description: "Toggle view whitespace." },
          { command: "Shift + Alt + L, S", description: "Sort lines." },
          { command: "Shift + Alt + L, J", description: "Join lines." },
        ],
      },
      {
        title: "Search & Replace",
        items: [
          { command: "Ctrl + F", description: "Find." },
          { command: "Ctrl + H", description: "Replace." },
          { command: "Ctrl + Shift + F", description: "Find in files." },
          { command: "Ctrl + Shift + H", description: "Replace in files." },
          { command: "F8 / Shift + F8", description: "Go to next / previous error." },
        ],
      },
      {
        title: "Refactoring",
        items: [
          { command: "Ctrl + . / Alt + Enter", description: "Show quick actions." },
          { command: "Ctrl + R, M", description: "Extract method." },
          { command: "Ctrl + R, I", description: "Extract interface." },
          { command: "Ctrl + R, R", description: "Rename symbol." },
          { command: "Ctrl + R, G", description: "Remove and sort usings." },
          { command: "Ctrl + K, E", description: "Code cleanup." },
          { command: "Ctrl + K, S", description: "Surround with (if, try, etc.)." },
          { command: "Shift + Alt + L, S", description: "Sort lines." },
          { command: "Shift + Alt + L, J", description: "Join lines." },
        ],
      },
      {
        title: "Navigation",
        items: [
          { command: "Ctrl + Q / Ctrl + Shift + P", description: "Feature search." },
          { command: "Ctrl + T", description: "Go to search." },
          { command: "Ctrl + G", description: "Go to line." },
          { command: "F8 / Shift + F8", description: "Go to next / previous error." },
          { command: "F12", description: "Go to definition." },
          { command: "Alt + F12", description: "Peek definition." },
          { command: "Ctrl + F12", description: "Go to implementation." },
          { command: "Shift + F12", description: "Find all references." },
          { command: "Alt + Home", description: "Go to base class." },
          { command: "Ctrl + - / Ctrl + Shift + -", description: "Navigate backward / forward." },
          { command: "Ctrl + Shift + Backspace", description: "Go to last edit location." },
          { command: "Ctrl + Shift + ↑ / ↓", description: "Go to next / previous reference." },
          { command: "Ctrl + K, K", description: "Toggle bookmark." },
          { command: "Ctrl + K, N / P", description: "Go to next / previous bookmark." },
          { command: "Ctrl + K, L", description: "Clear all bookmarks." },
        ],
      },
      {
        title: "Debugging",
        items: [
          { command: "F5", description: "Start / Continue debugging." },
          { command: "Shift + F5", description: "Stop debugging." },
          { command: "Ctrl + F5", description: "Start without debugging." },
          { command: "F9", description: "Toggle breakpoint." },
          { command: "Ctrl + Shift + F9", description: "Clear all breakpoints." },
          { command: "F10", description: "Step over." },
          { command: "F11", description: "Step into." },
          { command: "Shift + F11", description: "Step out." },
          { command: "Ctrl + Alt + P", description: "Attach to process." },
          { command: "Shift + Alt + P", description: "Reattach to process." },
          { command: "Alt + F2", description: "Launch profiler." },
          { command: "Shift + Alt + F2", description: "Relaunch profiler." },
        ],
      },
      {
        title: "Multi Caret & Selection",
        items: [
          { command: "Ctrl + Alt + Mouse Click", description: "Insert caret." },
          { command: "Shift + Alt + .", description: "Insert next matching caret." },
          { command: "Shift + Alt + ;", description: "Insert all matching carets." },
          { command: "Shift + Alt + ,", description: "Remove last caret." },
          { command: "Shift + Alt + /", description: "Move last caret down." },
          { command: "Shift + Alt + ↑ / ↓", description: "Column (box) selection." },
          { command: "Alt + Drag Mouse", description: "Column (box) selection." },
          { command: "Shift + Alt + /", description: "Expand / Collapse selection." },
        ],
      },
      {
        title: "Projects & Solutions",
        items: [
          { command: "Ctrl + Shift + N", description: "New project." },
          { command: "Ctrl + Shift + O", description: "Open project." },
          { command: "Ctrl + B", description: "Build selection." },
          { command: "Ctrl + Shift + B", description: "Build solution." },
        ],
      },
      {
        title: "File Management",
        items: [
          { command: "Ctrl + N", description: "New file." },
          { command: "Ctrl + O", description: "Open file." },
          { command: "Ctrl + Shift + S", description: "Save all." },
          { command: "Ctrl + Alt + PgUp / PgDn", description: "Go to document on left / right." },
          { command: "Ctrl + F4", description: "Close tab." },
          { command: "Ctrl + K, Z", description: "Restore closed tabs." },
          { command: "Ctrl + [", description: "Reveal active file in Explorer." },
          { command: "Ctrl + Tab", description: "Cycle through tabs." },
          { command: "F7 / Shift + F7", description: "Toggle designer and code view." },
          { command: "F4", description: "Properties window." },
        ],
      },
      {
        title: "Windows & Display",
        items: [
          { command: "Shift + Alt + Enter", description: "Toggle full screen." },
          { command: "Ctrl + Double Click on Window", description: "Toggle last dock / float location." },
          { command: "Ctrl + Alt + 1-9", description: "Switch saved window layout." },
          { command: "Shift + Esc", description: "Close active tool window." },
          { command: "Ctrl + Alt + L", description: "Activate Solution Explorer." },
          { command: "Ctrl + \\ + C", description: "Activate GitHub Copilot Chat." },
          { command: "Ctrl + \\ + E", description: "Activate Error List." },
          { command: "Ctrl + Alt + O", description: "Activate Output window." },
          { command: "Esc", description: "Set focus on editor." },
        ],
      },
      {
        title: "Git",
        items: [
          { command: "Alt + G, C", description: "Open Git Changes window." },
          { command: "Alt + G, M", description: "Open Git Repository window." },
          { command: "Ctrl + Alt + F3", description: "Branch picker." },
          { command: "Ctrl + Alt + F4", description: "Repository picker." },
          { command: "Ctrl + E, C", description: "Git actions menu." },
          { command: "Ctrl + Enter", description: "Commit changes." },
        ],
      },
      {
        title: "Unit Testing",
        items: [
          { command: "Ctrl + E, T", description: "Open Test Explorer." },
          { command: "Ctrl + R, A", description: "Run all tests." },
          { command: "Ctrl + R, L", description: "Repeat last run." },
          { command: "Ctrl + R, U", description: "Run until failure." },
          { command: "Ctrl + R, F", description: "Run failed tests." },
          { command: "Ctrl + R, N", description: "Run not run tests." },
          { command: "Ctrl + R, Delete", description: "Clear all test results." },
        ],
      },
    ],
  },
  {
    id: "intellij-webstorm",
    title: "IntelliJ IDEA / WebStorm",
    category: "Editors",
    sections: flat([
      { command: "Double Shift", description: "Search everywhere (files, actions, symbols)." },
      { command: "Ctrl+Shift+A", description: "Find action by name." },
      { command: "Ctrl+N / Ctrl+Shift+N", description: "Go to class / go to file." },
      { command: "Ctrl+B", description: "Go to declaration." },
      { command: "Alt+Enter", description: "Show quick-fix and intention actions." },
      { command: "Ctrl+Alt+L", description: "Reformat code." },
      { command: "Shift+F6", description: "Rename (refactor)." },
      { command: "Ctrl+Alt+M", description: "Extract selection into a method." },
      { command: "Ctrl+/", description: "Toggle line comment." },
      { command: "Ctrl+D", description: "Duplicate the current line." },
      { command: "Ctrl+E", description: "Show recent files." },
      { command: "Shift+F10", description: "Run the current configuration." },
    ]),
  },
  {
    id: "android-studio",
    title: "Android Studio",
    category: "Editors",
    sections: flat([
      { command: "Shift+F10", description: "Run the app on a device/emulator." },
      { command: "Shift+F9", description: "Debug the app." },
      { command: "Ctrl+Shift+A", description: "Find action (search all commands/settings)." },
      { command: "Alt+1", description: "Toggle the Project view." },
      { command: "Alt+6", description: "Toggle Logcat." },
      { command: "Ctrl+F9", description: "Build (make) the project." },
      { command: "Double Shift", description: "Search everywhere, including device/AVD manager." },
      { command: "Ctrl+Alt+Shift+S", description: "Open Project Structure settings." },
      { command: "Ctrl+Alt+Y", description: "Sync/refresh the layout preview." },
      { command: "Alt+Insert", description: "Generate code (constructors, getters, overrides)." },
    ]),
  },
  {
    id: "emmet",
    title: "Emmet",
    category: "Editors",
    sections: flat([
      { command: "!", description: "Expand an HTML boilerplate skeleton." },
      { command: "div.class", description: 'Expand to <div class="class"></div>.' },
      { command: "div#id", description: 'Expand to <div id="id"></div>.' },
      { command: "ul>li*3", description: "Nesting + multiplication: 3 <li> inside a <ul>." },
      { command: ".item+.item", description: "Sibling elements at the same nesting level." },
      { command: "(div>span)+p", description: "Group elements with parentheses." },
      { command: "div.item$*3", description: "Numbered items: item1, item2, item3." },
      { command: 'a[href="#"]', description: "Add an attribute to the expanded element." },
      { command: "p{Text}", description: "Expand to an element containing literal text." },
      { command: "p>lorem10", description: "Generate 10 words of placeholder text inside a <p>." },
      { command: "Tab", description: "Expand the abbreviation at the cursor." },
    ]),
  },

  // ---------------------------------------------------------------------
  // Shell & Terminal
  // ---------------------------------------------------------------------

  {
    id: "tmux",
    title: "Tmux",
    category: "Shell & Terminal",
    sections: [
      {
        title: "Sessions",
        items: [
          { command: "tmux", description: "Start a new tmux session." },
          { command: "tmux new", description: "Create a new session." },
          { command: "tmux new -s mysession", description: "Create a named session." },
          { command: "tmux ls", description: "List all sessions." },
          { command: "tmux attach", description: "Attach to the last session." },
          { command: "tmux attach -t mysession", description: "Attach to a named session." },
          { command: "tmux detach", description: "Detach the current client." },
          { command: "tmux kill-session -t mysession", description: "Kill a session." },
          { command: "tmux kill-server", description: "Stop tmux and all sessions." },

          { command: "Ctrl+b d", description: "Detach current session." },
          { command: "Ctrl+b s", description: "Choose a session." },
          { command: "Ctrl+b (", description: "Previous session." },
          { command: "Ctrl+b )", description: "Next session." },
          { command: "Ctrl+b $", description: "Rename current session." },
        ],
      },
      {
        title: "Windows",
        items: [
          { command: "Ctrl+b c", description: "Create a new window." },
          { command: "Ctrl+b ,", description: "Rename current window." },
          { command: "Ctrl+b &", description: "Close current window." },
          { command: "Ctrl+b w", description: "Choose window." },
          { command: "Ctrl+b n", description: "Next window." },
          { command: "Ctrl+b p", description: "Previous window." },
          { command: "Ctrl+b l", description: "Last active window." },
          { command: "Ctrl+b 0-9", description: "Jump to window by number." },
          { command: "Ctrl+b f", description: "Find window by name." },
        ],
      },
      {
        title: "Panes",
        items: [
          { command: "Ctrl+b %", description: "Split pane vertically." },
          { command: "Ctrl+b \"", description: "Split pane horizontally." },
          { command: "Ctrl+b o", description: "Move to next pane." },
          { command: "Ctrl+b ;", description: "Toggle last active pane." },
          { command: "Ctrl+b q", description: "Show pane numbers." },
          { command: "Ctrl+b x", description: "Close current pane." },
          { command: "Ctrl+b z", description: "Toggle pane zoom." },

          { command: "Ctrl+b ←", description: "Move to left pane." },
          { command: "Ctrl+b →", description: "Move to right pane." },
          { command: "Ctrl+b ↑", description: "Move to upper pane." },
          { command: "Ctrl+b ↓", description: "Move to lower pane." },
        ],
      },
      {
        title: "Pane Resizing",
        items: [
          { command: "Ctrl+b Ctrl+←", description: "Resize pane left." },
          { command: "Ctrl+b Ctrl+→", description: "Resize pane right." },
          { command: "Ctrl+b Ctrl+↑", description: "Resize pane up." },
          { command: "Ctrl+b Ctrl+↓", description: "Resize pane down." },

          { command: "Ctrl+b Alt+←", description: "Resize pane left (larger step)." },
          { command: "Ctrl+b Alt+→", description: "Resize pane right (larger step)." },
        ],
      },
      {
        title: "Layouts",
        items: [
          { command: "Ctrl+b Space", description: "Cycle pane layouts." },
          { command: "Ctrl+b {", description: "Swap pane with previous." },
          { command: "Ctrl+b }", description: "Swap pane with next." },
          { command: "Ctrl+b !", description: "Break pane into new window." },
          { command: "Ctrl+b Ctrl+o", description: "Rotate panes." },
        ],
      },
      {
        title: "Copy Mode",
        items: [
          { command: "Ctrl+b [", description: "Enter copy mode." },
          { command: "/", description: "Search forward." },
          { command: "?", description: "Search backward." },
          { command: "Space", description: "Begin selection." },
          { command: "Enter", description: "Copy selection." },
          { command: "q", description: "Quit copy mode." },
          { command: "g", description: "Go to top." },
          { command: "G", description: "Go to bottom." },
          { command: "Ctrl+b ]", description: "Paste copied text." },
        ],
      },
      {
        title: "Copy Mode (Vi Keys)",
        items: [
          { command: "set -g mode-keys vi", description: "Enable vi-style navigation." },
          { command: "h / j / k / l", description: "Move cursor." },
          { command: "w", description: "Next word." },
          { command: "b", description: "Previous word." },
          { command: "0", description: "Start of line." },
          { command: "$", description: "End of line." },
          { command: "v", description: "Begin visual selection." },
          { command: "y", description: "Yank selection." },
          { command: "n", description: "Next search result." },
          { command: "N", description: "Previous search result." },
        ],
      },
      {
        title: "Synchronization",
        items: [
          { command: "setw synchronize-panes on", description: "Broadcast input to every pane." },
          { command: "setw synchronize-panes off", description: "Disable synchronized input." },
        ],
      },
      {
        title: "Command Mode",
        items: [
          { command: "Ctrl+b :", description: "Open tmux command prompt." },
          { command: "list-keys", description: "Show every key binding." },
          { command: "show-options", description: "Display current options." },
          { command: "source-file ~/.tmux.conf", description: "Reload tmux configuration." },
        ],
      },
      {
        title: "Configuration",
        items: [
          { command: "~/.tmux.conf", description: "Main tmux configuration file." },
          { command: "set -g mouse on", description: "Enable mouse support." },
          { command: "set -g history-limit 100000", description: "Increase scrollback history." },
          { command: "set -g base-index 1", description: "Start window numbering at 1." },
          { command: "setw -g pane-base-index 1", description: "Start pane numbering at 1." },
        ],
      },
      {
        title: "Tmux Plugin Manager (TPM)",
        items: [
          { command: "Prefix + I", description: "Install plugins." },
          { command: "Prefix + U", description: "Update plugins." },
          { command: "Prefix + Alt+u", description: "Remove unused plugins." },
        ],
      },
      {
        title: "Miscellaneous",
        items: [
          { command: "tmux info", description: "Display tmux server information." },
          { command: "tmux list-keys", description: "List all key bindings." },
          { command: "tmux capture-pane", description: "Capture pane contents." },
          { command: "tmux save-buffer file.txt", description: "Save copied buffer to file." },
          { command: "tmux show-buffer", description: "Display copy buffer." },
        ],
      },
    ]
  },
  {
    id: "bash",
    title: "Bash",
    category: "Shell & Terminal",
    sections: [
      {
        title: "Navigation & Files",
        items: [
          { command: "pwd", description: "Print the working directory." },
          { command: "ls -la", description: "List all files, including hidden, in long format." },
          { command: "cd -", description: "Switch to the previous working directory." },
          { command: "cp -r src dest", description: "Copy a directory recursively." },
          { command: "mv old new", description: "Move or rename a file/directory." },
          { command: "rm -rf dir", description: "Remove a directory forcefully and recursively." },
          { command: "mkdir -p a/b/c", description: "Create nested directories in one go." },
          { command: 'find . -name "*.js"', description: "Find files by name pattern." },
        ],
      },
      {
        title: "Viewing & Searching",
        items: [
          { command: "cat file", description: "Print a file's contents." },
          { command: "less file", description: "Page through a file's contents." },
          { command: "head -n 20 file", description: "Show the first 20 lines of a file." },
          { command: "tail -f file", description: "Follow a file's new output live." },
          { command: 'grep -r "text" .', description: "Search recursively for text." },
          { command: "wc -l file", description: "Count the number of lines in a file." },
        ],
      },
      {
        title: "Permissions",
        items: [
          { command: "chmod +x file", description: "Make a file executable." },
          { command: "chmod 644 file", description: "Set explicit read/write/execute permission bits." },
          { command: "chown user:group file", description: "Change a file's owner and group." },
          { command: "sudo command", description: "Run a command as another user (typically root)." },
        ],
      },
      {
        title: "Processes",
        items: [
          { command: "ps aux", description: "List all running processes." },
          { command: "top / htop", description: "Live, interactive process monitor." },
          { command: "kill PID", description: "Send a termination signal to a process." },
          { command: "kill -9 PID", description: "Force-kill a process." },
          { command: "pkill name", description: "Kill processes matching a name." },
        ],
      },
      {
        title: "I/O Redirection & Pipes",
        items: [
          { command: "cmd1 | cmd2", description: "Pipe the output of one command into another." },
          { command: "cmd > file", description: "Redirect stdout to a file (overwrite)." },
          { command: "cmd >> file", description: "Redirect stdout to a file (append)." },
          { command: "cmd 2> file", description: "Redirect stderr to a file." },
          { command: "cmd > file 2>&1", description: "Redirect both stdout and stderr to a file." },
          { command: "cmd < file", description: "Use a file as a command's stdin." },
        ],
      },
      {
        title: "Variables & Environment",
        items: [
          { command: "export VAR=value", description: "Set an environment variable for child processes." },
          { command: "echo $VAR", description: "Print a variable's value." },
          { command: "$(command)", description: "Command substitution — use output as text." },
          { command: "$?", description: "Exit status of the last command." },
        ],
      },
      {
        title: "Job Control",
        items: [
          { command: "cmd &", description: "Run a command in the background." },
          { command: "jobs", description: "List background jobs." },
          { command: "fg / bg", description: "Resume a job in the foreground / background." },
          { command: "Ctrl+Z", description: "Suspend the current foreground job." },
          { command: "Ctrl+C", description: "Send SIGINT to the foreground job." },
        ],
      },
      {
        title: "History & Shortcuts",
        items: [
          { command: "history | grep cmd", description: "Search command history." },
          { command: "Ctrl+R", description: "Reverse-search command history interactively." },
          { command: "alias ll='ls -la'", description: "Create a shorthand for a longer command." },
          { command: "!!", description: "Repeat the last command." },
        ],
      },
    ],
  },
  {
    id: "powershell",
    title: "PowerShell",
    category: "Shell & Terminal",
    sections: [
      {
        title: "Navigation",
        items: [
          { command: "Get-Location (pwd)", description: "Show the current working directory." },
          { command: "Set-Location path (cd)", description: "Change the current directory." },
          { command: "Get-ChildItem (ls, dir)", description: "List files and folders." },
          { command: "Push-Location path", description: "Save current location and change directory." },
          { command: "Pop-Location", description: "Return to the previous location." },
        ],
      },

      {
        title: "File & Directory Management",
        items: [
          { command: "New-Item file.txt -ItemType File", description: "Create a new file." },
          { command: "New-Item folder -ItemType Directory", description: "Create a new directory." },
          { command: "Copy-Item src dest", description: "Copy a file." },
          { command: "Copy-Item src dest -Recurse", description: "Copy a directory recursively." },
          { command: "Move-Item src dest", description: "Move or rename a file." },
          { command: "Rename-Item old new", description: "Rename a file or folder." },
          { command: "Remove-Item path", description: "Delete a file." },
          { command: "Remove-Item path -Recurse -Force", description: "Delete a directory recursively." },
          { command: "Test-Path path", description: "Check whether a path exists." },
          { command: "Resolve-Path path", description: "Resolve a path to its absolute location." },
        ],
      },

      {
        title: "File Content",
        items: [
          { command: "Get-Content file.txt", description: "Read a file." },
          { command: "Get-Content file.txt -Tail 20", description: "View the last 20 lines of a file." },
          { command: "Get-Content file.txt -Wait", description: "Follow a file as it grows (like tail -f)." },
          { command: "Set-Content file.txt text", description: "Overwrite a file." },
          { command: "Add-Content file.txt text", description: "Append text to a file." },
          { command: "Clear-Content file.txt", description: "Remove all content from a file." },
          { command: "Out-File file.txt", description: "Write pipeline output to a file." },
        ],
      },

      {
        title: "Process Management",
        items: [
          { command: "Get-Process", description: "List running processes." },
          { command: "Get-Process chrome", description: "Find a process by name." },
          { command: "Start-Process notepad", description: "Launch an application." },
          { command: "Stop-Process -Id pid", description: "Stop a process by ID." },
          { command: "Stop-Process -Name chrome", description: "Stop a process by name." },
          { command: "Wait-Process -Name process", description: "Wait for a process to exit." },
        ],
      },

      {
        title: "Services",
        items: [
          { command: "Get-Service", description: "List Windows services." },
          { command: "Get-Service spooler", description: "Display a specific service." },
          { command: "Start-Service name", description: "Start a service." },
          { command: "Stop-Service name", description: "Stop a service." },
          { command: "Restart-Service name", description: "Restart a service." },
          { command: "Set-Service name -StartupType Automatic", description: "Configure a service startup type." },
        ],
      },

      {
        title: "Pipeline & Object Processing",
        items: [
          { command: "Where-Object { ... }", description: "Filter objects in the pipeline." },
          { command: "ForEach-Object { ... }", description: "Execute code for each pipeline object." },
          { command: "Select-Object -First 10", description: "Select the first N objects." },
          { command: "Select-Object -Last 10", description: "Select the last N objects." },
          { command: "Sort-Object Name", description: "Sort objects by a property." },
          { command: "Group-Object Extension", description: "Group objects by a property." },
          { command: "Measure-Object", description: "Count or summarize objects." },
          { command: "Tee-Object file.txt", description: "Write output to both the console and a file." },
        ],
      },

      {
        title: "Searching",
        items: [
          { command: "Select-String pattern file.txt", description: "Search for text inside files." },
          { command: "Get-ChildItem -Recurse", description: "Recursively list files." },
          { command: "Get-Command git*", description: "Search installed commands." },
          { command: "Get-Help *process*", description: "Search help topics." },
        ],
      },

      {
        title: "Variables & Environment",
        items: [
          { command: "$x = 10", description: "Create a variable." },
          { command: "$env:PATH", description: "Display an environment variable." },
          { command: '$env:VAR = "value"', description: "Set an environment variable." },
          { command: "Remove-Variable x", description: "Delete a variable." },
          { command: "Get-Variable", description: "List all variables." },
        ],
      },

      {
        title: "Networking",
        items: [
          { command: "Invoke-WebRequest url", description: "Download a web page." },
          { command: "Invoke-RestMethod url", description: "Call a REST API." },
          { command: "Test-NetConnection host", description: "Test network connectivity." },
          { command: "Resolve-DnsName domain", description: "Resolve DNS records." },
          { command: "Get-NetIPAddress", description: "Display IP addresses." },
          { command: "Get-NetTCPConnection", description: "Display active TCP connections." },
        ],
      },

      {
        title: "System Information",
        items: [
          { command: "Get-ComputerInfo", description: "Display system information." },
          { command: "hostname", description: "Show the computer name." },
          { command: "Get-Date", description: "Display the current date and time." },
          { command: "Get-History", description: "Show command history." },
          { command: "Clear-History", description: "Clear command history." },
          { command: "Get-Alias", description: "List command aliases." },
        ],
      },

      {
        title: "Archives",
        items: [
          { command: "Compress-Archive src.zip", description: "Create a ZIP archive." },
          { command: "Expand-Archive archive.zip", description: "Extract a ZIP archive." },
        ],
      },

      {
        title: "Help & Discovery",
        items: [
          { command: "Get-Help cmdlet", description: "Display help for a command." },
          { command: "Get-Help cmdlet -Examples", description: "Show examples." },
          { command: "Get-Help cmdlet -Full", description: "Display complete documentation." },
          { command: "Get-Command", description: "List available commands." },
          { command: "Get-Member", description: "Inspect object properties and methods." },
          { command: "Update-Help", description: "Download the latest help documentation." },
        ],
      },

      {
        title: "Modules",
        items: [
          { command: "Get-Module", description: "List loaded modules." },
          { command: "Get-Module -ListAvailable", description: "List installed modules." },
          { command: "Import-Module module", description: "Import a module." },
          { command: "Remove-Module module", description: "Unload a module." },
          { command: "Install-Module module", description: "Install a PowerShell Gallery module." },
          { command: "Update-Module module", description: "Update an installed module." },
        ],
      },

      {
        title: "Jobs",
        items: [
          { command: "Start-Job { ... }", description: "Run a background job." },
          { command: "Get-Job", description: "List background jobs." },
          { command: "Receive-Job job", description: "Retrieve job output." },
          { command: "Stop-Job job", description: "Stop a background job." },
          { command: "Remove-Job job", description: "Delete a completed job." },
        ],
      },

      {
        title: "Scripting",
        items: [
          { command: ".\\script.ps1", description: "Run a PowerShell script." },
          { command: "Set-ExecutionPolicy RemoteSigned", description: "Allow local scripts to run." },
          { command: "Start-Transcript", description: "Record the current PowerShell session." },
          { command: "Stop-Transcript", description: "Stop recording the session." },
          { command: "$PROFILE", description: "Display the current PowerShell profile path." },
          { command: "notepad $PROFILE", description: "Edit your PowerShell profile." },
        ],
      },
    ],
  },
  {
    id: "grep",
    title: "Grep",
    category: "Shell & Terminal",
    sections: [
      {
        title: "Basic Searching",
        items: [
          { command: 'grep "pattern" file', description: "Search for a literal pattern in a file.", example: 'grep "ERROR" server.log' },
          { command: "grep -i", description: "Case-insensitive search.", example: 'grep -i "error" server.log' },
          { command: "grep -w", description: "Match whole words only (prevents partial word matches).", example: 'grep -w "is" document.txt' },
          { command: "grep -x", description: "Match entire lines exactly.", example: 'grep -x "exact line text" file.txt' },
          { command: "grep -F", description: "Treat pattern as a fixed string (disables regex for speed).", example: 'grep -F "api/v1/users" access.log' }
        ]
      },
      {
        title: "Directory & File Filtering",
        items: [
          { command: 'grep -r "pattern" dir', description: "Search recursively through a directory.", example: 'grep -r "TODO" ./src' },
          { command: 'grep -R "pattern" dir', description: "Search recursively while following symlinks.", example: 'grep -R "database_url" /etc' },
          { command: "grep -l", description: "List only the names of files that contain matches.", example: 'grep -rl "import React" ./src' },
          { command: "grep -L", description: "List only the names of files that do NOT contain matches.", example: 'grep -L "LICENSE" ./*' },
          { command: 'grep --include="*.ts" -r', description: "Restrict search to specific file extensions.", example: 'grep -r --include="*.js" "function" .' },
          { command: 'grep --exclude-dir={node_modules,dist}', description: "Exclude specific directories from search.", example: 'grep -r --exclude-dir=node_modules "secret" .' }
        ]
      },
      {
        title: "Output Formatting & Line Numbers",
        items: [
          { command: "grep -n", description: "Display 1-based line numbers along with matching lines.", example: 'grep -n "main" app.py' },
          { command: "grep -c", description: "Count the total number of matching lines per file.", example: 'grep -c "200 OK" access.log' },
          { command: "grep -o", description: "Print only the matched parts of a line, not the full line.", example: 'grep -o -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" file.txt' },
          { command: "grep -v", description: "Invert match: print all lines that do NOT match.", example: 'grep -v "^#" config.conf' },
          { command: "grep -H", description: "Always print filename for each match (default for multiple files).", example: 'grep -H "root" /etc/passwd' }
        ]
      },
      {
        title: "Context Control",
        items: [
          { command: "grep -A <N>", description: "Show N lines of trailing context AFTER each match.", example: 'grep -A 3 "Exception" error.log' },
          { command: "grep -B <N>", description: "Show N lines of leading context BEFORE each match.", example: 'grep -B 2 "FAILED" test.log' },
          { command: "grep -C <N>", description: "Show N lines of context BOTH before and after each match.", example: 'grep -C 5 "CRITICAL" system.log' }
        ]
      },
      {
        title: "Regular Expressions",
        items: [
          { command: 'grep -E "a|b"', description: "Use Extended Regular Expressions (ERE: |, +, ?, (), etc.).", example: 'grep -E "error|warning|fatal" app.log' },
          { command: "grep -P", description: "Use Perl-Compatible Regular Expressions (PCRE for lookarounds, etc.).", example: 'grep -P "(?<=user_id=)\\d+" server.log' },
          { command: 'grep "^pattern"', description: "Match pattern at the start of a line.", example: 'grep "^import" index.ts' },
          { command: 'grep "pattern$"', description: "Match pattern at the end of a line.", example: 'grep "}$" style.css' }
        ]
      }
    ]
  },
  {
    id: "cron",
    title: "Cron Jobs",
    category: "Shell & Terminal",
    sections: [
      {
        title: "Common Schedules",
        items: [
          { command: "* * * * *", description: "Run every minute.", example: "* * * * * /path/to/script.sh" },
          { command: "*/15 * * * *", description: "Run every 15 minutes.", example: "*/15 * * * * /usr/bin/check-health" },
          { command: "0 * * * *", description: "Run at the top of every hour.", example: "0 * * * * /usr/bin/hourly-task" },
          { command: "0 0 * * *", description: "Run daily at midnight.", example: "0 0 * * * /path/to/daily-backup.sh" },
          { command: "0 9 * * 1-5", description: "Run at 9:00 AM on weekdays (Mon-Fri).", example: "0 9 * * 1-5 /path/to/workday-report.sh" },
          { command: "0 0 * * 0", description: "Run weekly on Sunday at midnight.", example: "0 0 * * 0 /usr/bin/weekly-cleanup" },
          { command: "0 0 1 * *", description: "Run monthly on the 1st day at midnight.", example: "0 0 1 * * /path/to/monthly-billing.sh" },
          { command: "0 0 1 1 *", description: "Run annually on January 1st at midnight.", example: "0 0 1 1 * /path/to/annual-archive.sh" }
        ]
      },
      {
        title: "Special Predefined Shortcuts",
        items: [
          { command: "@reboot", description: "Run once immediately after system startup.", example: "@reboot /usr/bin/start-service.sh" },
          { command: "@hourly", description: "Run once an hour (equivalent to 0 * * * *).", example: "@hourly /path/to/sync.sh" },
          { command: "@daily", description: "Run once a day at midnight (0 0 * * *).", example: "@daily /path/to/rotate-logs.sh" },
          { command: "@weekly", description: "Run once a week on Sunday midnight (0 0 * * 0).", example: "@weekly /path/to/vacuum-db.sh" },
          { command: "@monthly", description: "Run once a month on the 1st day (0 0 1 * *).", example: "@monthly /path/to/monthly-report.sh" },
          { command: "@yearly", description: "Run once a year on Jan 1st (0 0 1 1 *).", example: "@yearly /path/to/renew-certs.sh" }
        ]
      },
      {
        title: "Crontab Management",
        items: [
          { command: "crontab -e", description: "Edit the current user's crontab file.", example: "crontab -e" },
          { command: "crontab -l", description: "Display/list the current user's scheduled cron jobs.", example: "crontab -l" },
          { command: "crontab -r", description: "Remove/delete all scheduled jobs for the current user.", example: "crontab -r" },
          { command: "crontab -u <user> -e", description: "Edit another user's crontab (requires root).", example: "sudo crontab -u www-data -e" },
          { command: "crontab <file>", description: "Overwrite crontab with jobs defined in a text file.", example: "crontab my-cron-jobs.txt" }
        ]
      },
      {
        title: "Environment & Output Controls",
        items: [
          { command: 'MAILTO=""', description: "Disable email notifications for cron outputs.", example: 'MAILTO=""' },
          { command: "MAILTO=\"user@example.com\"", description: "Direct execution output/errors to a specific email.", example: 'MAILTO="devs@company.com"' },
          { command: "PATH=/usr/local/bin:/usr/bin:/bin", description: "Set explicitly allowed PATH variables for cron shell.", example: "PATH=/usr/local/bin:/usr/bin:/bin" },
          { command: "SHELL=/bin/bash", description: "Specify execution shell interpreter.", example: "SHELL=/bin/bash" },
          { command: "> /path/file.log 2>&1", description: "Redirect both stdout and stderr to a log file.", example: "0 2 * * * /script.sh > /var/log/cron.log 2>&1" },
          { command: "> /dev/null 2>&1", description: "Silence all output completely (blackhole).", example: "*/5 * * * * /script.sh > /dev/null 2>&1" }
        ]
      }
    ]
  },
  {
    id: "ssh",
    title: "SSH",
    category: "Shell & Terminal",
    sections: flat([
      { command: "ssh user@host", description: "Connect to a remote host." },
      { command: "ssh -p 2222 user@host", description: "Connect on a custom port." },
      { command: "ssh-keygen -t ed25519", description: "Generate a new SSH key pair." },
      { command: "ssh-copy-id user@host", description: "Copy your public key to a remote host's authorized_keys." },
      { command: "scp file user@host:/path", description: "Copy a file to a remote host." },
      { command: "scp -r dir user@host:/path", description: "Copy a directory recursively over SSH." },
      { command: "ssh -L 8080:localhost:80 user@host", description: "Forward a local port through the remote host." },
      { command: "ssh -i ~/.ssh/key user@host", description: "Connect using a specific private key." },
      { command: "~/.ssh/config", description: "Store reusable per-host connection shortcuts." },
      { command: 'ssh user@host "command"', description: "Run a single command on the remote host and exit." },
    ]),
  },
  {
    id: "curl",
    title: "cURL",
    category: "Shell & Terminal",
    sections: [
      {
        title: "Basic Requests & Inspection",
        items: [
          { command: "curl <url>", description: "Make a GET request and print response body.", example: "curl https://api.github.com/users/octocat" },
          { command: "curl -I <url>", description: "Fetch only response headers (HEAD request).", example: "curl -I https://example.com" },
          { command: "curl -i <url>", description: "Include HTTP response headers alongside body.", example: "curl -i https://httpbin.org/get" },
          { command: "curl -v <url>", description: "Verbose mode; prints full request/response handshake details.", example: "curl -v https://api.example.com" },
          { command: "curl -s <url>", description: "Silent mode; hides progress meter and error messages.", example: "curl -s https://api.example.com/data.json" },
          { command: "curl -L <url>", description: "Follow HTTP redirects automatically.", example: "curl -L http://google.com" }
        ]
      },
      {
        title: "Downloading & Saving Files",
        items: [
          { command: "curl -O <url>", description: "Download a file using its remote filename.", example: "curl -O https://example.com/archive.zip" },
          { command: "curl -o <filename> <url>", description: "Download a file and save it under a custom local name.", example: "curl -o my_file.zip https://example.com/archive.zip" },
          { command: "curl -C - -O <url>", description: "Resume an interrupted file download.", example: "curl -C - -O https://example.com/large_file.iso" },
          { command: "curl -u <user>:<pass> <url>", description: "Authenticate via HTTP Basic Auth.", example: "curl -u admin:secret123 https://api.example.com/protected" }
        ]
      },
      {
        title: "HTTP Methods & Data (POST/PUT/DELETE)",
        items: [
          { command: 'curl -X POST -d "key=value" <url>', description: "Send POST request with URL-encoded form data.", example: 'curl -X POST -d "username=john&status=active" https://example.com/login' },
          { command: 'curl -X POST -H "Content-Type: application/json" -d \'{...}\' <url>', description: "Send POST request with JSON payload.", example: 'curl -X POST -H "Content-Type: application/json" -d \'{"name": "Alice"}\' https://api.example.com/users' },
          { command: "curl -X PUT -d @<file.json> <url>", description: "Send PUT request using raw file data.", example: "curl -X PUT -H \"Content-Type: application/json\" -d @data.json https://api.example.com/users/1" },
          { command: "curl -X DELETE <url>", description: "Send a DELETE request.", example: "curl -X DELETE https://api.example.com/users/123" },
          { command: 'curl --data-urlencode "q=a b" <url>', description: "Automatically URL-encode form parameters.", example: 'curl -G --data-urlencode "q=hello world" https://api.example.com/search' }
        ]
      },
      {
        title: "Headers, Cookies & Forms",
        items: [
          { command: 'curl -H "Header: Value" <url>', description: "Set custom request header.", example: 'curl -H "Authorization: Bearer TOKEN_HERE" https://api.example.com/user' },
          { command: 'curl -F "file=@/path/to/file" <url>', description: "Upload a file using multipart form-data.", example: 'curl -F "avatar=@/home/user/photo.png" https://example.com/upload' },
          { command: 'curl -b "name=val" <url>', description: "Pass cookies in the request.", example: 'curl -b "session_id=12345" https://example.com/dashboard' },
          { command: "curl -c <cookie_file> <url>", description: "Save response cookies to a local text file.", example: "curl -c cookies.txt https://example.com/login" }
        ]
      },
      {
        title: "SSL & Advanced Options",
        items: [
          { command: "curl -k <url>", description: "Insecure mode; skip SSL certificate verification.", example: "curl -k https://self-signed.local" },
          { command: "curl -x <proxy:port> <url>", description: "Tunnel request through a proxy server.", example: "curl -x http://127.0.0.1:8080 https://example.com" },
          { command: "curl -m <seconds> <url>", description: "Set maximum time limit allowed for the whole transfer.", example: "curl -m 10 https://slow.example.com" },
          { command: "curl --retry <num> <url>", description: "Retry request N times if transient errors occur.", example: "curl --retry 3 https://unstable.example.com" }
        ]
      }
    ]
  },
  {
    id: "linux-sysadmin",
    title: "Linux System Administration",
    category: "Shell & Terminal",
    sections: [
      {
        title: "System Info & Resources",
        items: [
          { command: "uname -a", description: "Print all system info (kernel, architecture, OS).", example: "Linux server 5.15.0-x86_64" },
          { command: "htop / top", description: "Display live process monitoring and CPU/Memory usage.", example: "htop" },
          { command: "df -h", description: "Display human-readable disk space usage by filesystem.", example: "df -h" },
          { command: "du -sh <dir>", description: "Summarize total disk usage of a specific directory.", example: "du -sh /var/log" },
          { command: "free -h", description: "Display total, used, and available RAM and Swap.", example: "free -h" },
          { command: "uptime", description: "Show system run duration and average load.", example: "uptime" }
        ]
      },
      {
        title: "Process Management",
        items: [
          { command: "ps aux", description: "List all currently running processes.", example: "ps aux | grep node" },
          { command: "kill <PID>", description: "Terminate process gracefully by ID.", example: "kill 1234" },
          { command: "kill -9 <PID>", description: "Forcefully kill process immediately.", example: "kill -9 1234" },
          { command: "pkill <name>", description: "Kill processes matching command name.", example: "pkill -f python3" }
        ]
      },
      {
        title: "Users, Permissions & Ownership",
        items: [
          { command: "chmod <perms> <file>", description: "Change file access permissions (numeric or symbolic).", example: "chmod 755 script.sh" },
          { command: "chown <user>:<group> <file>", description: "Change file owner and group.", example: "chown -R www-data:www-data /var/www" },
          { command: "useradd -m <user>", description: "Create a new user with home directory.", example: "sudo useradd -m devuser" },
          { command: "usermod -aG <group> <user>", description: "Add existing user to specified group.", example: "sudo usermod -aG docker devuser" }
        ]
      },
      {
        title: "Services & Logs (Systemd)",
        items: [
          { command: "systemctl status <svc>", description: "Check current running state of system service.", example: "systemctl status nginx" },
          { command: "systemctl start/stop/restart <svc>", description: "Control service state.", example: "sudo systemctl restart nginx" },
          { command: "systemctl enable <svc>", description: "Set service to auto-start on boot.", example: "sudo systemctl enable docker" },
          { command: "journalctl -u <svc> -f", description: "Stream live system logs for a service.", example: "journalctl -u nginx -f" }
        ]
      },
      {
        title: "Networking & Firewall",
        items: [
          { command: "ip a", description: "Show network interfaces and IP addresses.", example: "ip a" },
          { command: "netstat -tulnp", description: "List listening ports and matching process IDs.", example: "sudo netstat -tulnp" },
          { command: "ufw status / enable", description: "Check status or enable Uncomplicated Firewall.", example: "sudo ufw allow 80/tcp" }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------
  // Web Dev
  // ---------------------------------------------------------------------

  {
    id: "regex",
    title: "Regular Expressions (RegEx)",
    category: "Web Dev",
    sections: [
      {
        title: "Character Classes",
        items: [
          { command: ".", description: "Any character except a newline", example: "Matches 'a', '1', '%', ' '" },
          { command: "\\d", description: "Any digit (0-9)", example: "Matches '5' in 'cat5'" },
          { command: "\\D", description: "Any non-digit", example: "Matches 'c', 'a', 't' in 'cat5'" },
          { command: "\\w", description: "Word character (letter, digit, underscore)", example: "Matches 'a', 'B', '9', '_'" },
          { command: "\\W", description: "Any non-word character", example: "Matches '!', '@', ' ', '-'" },
          { command: "\\s", description: "Any whitespace (space, tab, newline)", example: "Matches ' ' or '\\t'" },
          { command: "[abc]", description: "Any one of a, b, or c", example: "Matches 'a' in 'apple'" },
          { command: "[a-z]", description: "Any lowercase letter in the range", example: "Matches any letter from 'a' to 'z'" },
          { command: "[^abc]", description: "Any character except a, b, or c", example: "Matches 'd' in 'dog'" }
        ]
      },
      {
        title: "Quantifiers",
        items: [
          { command: "*", description: "Zero or more times", example: "a* matches '', 'a', 'aaa'" },
          { command: "+", description: "One or more times", example: "a+ matches 'a', 'aa', but not ''" },
          { command: "?", description: "Zero or one (optional)", example: "colou?r matches 'color' and 'colour'" },
          { command: "{3}", description: "Exactly 3 times", example: "\\d{3} matches '123'" },
          { command: "{2,4}", description: "Between 2 and 4 times", example: "\\d{2,4} matches '12', '123', or '1234'" },
          { command: "{2,}", description: "2 or more times", example: "\\d{2,} matches '12', '123456'" },
          { command: "*?", description: "Lazy: as few as possible", example: "<.*?> matches '<div>' in '<div>hello</div>'" },
          { command: "+?", description: "Lazy: one or more, minimal", example: "a+? stops at the first possible match" }
        ]
      },
      {
        title: "Anchors & Boundaries",
        items: [
          { command: "^", description: "Start of the string (or line)", example: "^Hello matches 'Hello' at the beginning of input" },
          { command: "$", description: "End of the string (or line)", example: "world$ matches 'world' at the end of input" },
          { command: "\\b", description: "A word boundary", example: "\\bcat\\b matches 'cat' but not 'catfish'" },
          { command: "\\B", description: "A non-word boundary", example: "cat\\B matches 'cat' in 'catfish'" },
          { command: "^abc$", description: "A string that is exactly abc", example: "Matches only 'abc' as the entire input" },
          { command: "\\bword\\b", description: "Word as a whole word", example: "Matches standalone 'word' only" }
        ]
      },
      {
        title: "Groups & Capturing",
        items: [
          { command: "(abc)", description: "Capturing group, stored as group 1", example: "Captures 'abc' for extraction or reuse" },
          { command: "(?:abc)", description: "Non-capturing group", example: "Groups 'abc' without capturing for memory efficiency" },
          { command: "(?<year>\\d{4})", description: "Named capturing group 'year'", example: "Access captured output by name 'year'" },
          { command: "(ab)+", description: "Repeat the whole group", example: "Matches 'ab', 'abab', 'ababab'" },
          { command: "\\1", description: "Backreference to group 1", example: "([a-z])\\1 matches double letters like 'ee' or 'tt'" },
          { command: "\\k<year>", description: "Backreference to a named group", example: "Matches the exact value captured in group 'year'" }
        ]
      },
      {
        title: "Alternation",
        items: [
          { command: "a|b", description: "Either a or b", example: "Matches 'a' or 'b'" },
          { command: "cat|dog", description: "The word cat or dog", example: "Matches 'cat' or 'dog'" },
          { command: "(jpg|png|gif)", description: "Any one of the alternatives, captured", example: "Matches image extensions" },
          { command: "gr(a|e)y", description: "gray or grey", example: "Matches both US and UK spelling" },
          { command: "^(yes|no)$", description: "Exactly yes or exactly no", example: "Validates exact boolean text inputs" }
        ]
      },
      {
        title: "Lookarounds",
        items: [
          { command: "(?=abc)", description: "Lookahead: followed by abc", example: "q(?=u) matches 'q' only if followed by 'u'" },
          { command: "(?!abc)", description: "Negative lookahead: not followed by abc", example: "q(?!u) matches 'q' only if NOT followed by 'u'" },
          { command: "(?<=abc)", description: "Lookbehind: preceded by abc", example: "(?<=@)\\w+ matches domain names after '@'" },
          { command: "(?<!abc)", description: "Negative lookbehind: not preceded by abc", example: "(?<!\\$)\\d+ matches numbers without a dollar sign" },
          { command: "\\d+(?=\\sdollars)", description: "Digits only when followed by dollars", example: "Matches '100' in '100 dollars'" },
          { command: "(?<=^\\$)\\d+", description: "Digits only when preceded by $", example: "Matches '50' in '$50'" }
        ]
      },
      {
        title: "Flags",
        items: [
          { command: "g", description: "Global: find all matches, not just the first", example: "/cat/g finds all instances of 'cat'" },
          { command: "i", description: "Case-insensitive matching", example: "/cat/i matches 'cat', 'Cat', and 'CAT'" },
          { command: "m", description: "Multiline: ^ and $ match line ends", example: "Treats beginning and end of each line separately" },
          { command: "s", description: "Dotall: . also matches newlines", example: "Allows '.' to cross line breaks" },
          { command: "u", description: "Unicode mode", example: "Enables full Unicode matching capabilities" },
          { command: "x", description: "Extended: ignore whitespace in the pattern", example: "Allows formatted and commented RegEx patterns" }
        ]
      },
      {
        title: "Common Patterns",
        items: [
          { command: "^\\d+$", description: "A whole number (digits only)", example: "Validates input like '12345'" },
          { command: "^[\\w.-]+@[\\w.-]+\\.[\\w.-]+$", description: "A basic email address", example: "Matches 'user@example.com'" },
          { command: "https?:\\/\\/[^\\s]+", description: "An http or https URL", example: "Matches 'https://example.com/page'" },
          { command: "^\\d{4}-\\d{2}-\\d{2}$", description: "A date like YYYY-MM-DD", example: "Validates '2026-05-27'" },
          { command: "^\\d{3}-\\d{3}-\\d{4}$", description: "A US phone number", example: "Validates '555-123-4567'" },
          { command: "^#?[0-9a-fA-F]{6}$", description: "A 6-digit hex color", example: "Matches '#FF5733' or 'FF5733'" },
          { command: "\\s+", description: "One or more whitespace characters", example: "Useful for splitting strings by space/tab" }
        ]
      }
    ]
  },
  {
    id: "npm",
    title: "npm",
    category: "Web Dev",
    sections: flat([
      { command: "npm init -y", description: "Create a package.json with default values." },
      { command: "npm install (npm i)", description: "Install dependencies listed in package.json." },
      { command: "npm install pkg", description: "Add a package and save it as a dependency." },
      { command: "npm install -D pkg", description: "Add a package as a dev dependency." },
      { command: "npm install -g pkg", description: "Install a package globally." },
      { command: "npm uninstall pkg", description: "Remove a dependency." },
      { command: "npm run script", description: "Run a script defined in package.json." },
      { command: "npm update", description: "Update packages to their latest allowed versions." },
      { command: "npm outdated", description: "List installed packages that have newer versions available." },
      { command: "npm ci", description: "Clean-install exactly what's in package-lock.json." },
      { command: "npm list", description: "List installed dependencies and their versions." },
      { command: "npx pkg", description: "Run a package's binary without installing it globally." },
      { command: "npm publish", description: "Publish the package to the npm registry." },
      { command: "npm version patch", description: "Bump the package's patch version and tag the commit." },
    ]),
  },
  {
    id: "http-status-codes",
    title: "HTTP Status Codes",
    category: "Web Dev",
    sections: [
      {
        title: "1xx Informational",
        items: [
          { command: "100 Continue", description: "Server received initial request headers; client should proceed to send body.", example: "Used in large file uploads with Expect: 100-continue." },
          { command: "101 Switching Protocols", description: "Server agrees to switch protocols specified by client's Upgrade header.", example: "Handshake response when upgrading HTTP to WebSocket." }
        ]
      },
      {
        title: "2xx Success",
        items: [
          { command: "200 OK", description: "Standard successful HTTP request.", example: "Successful GET or POST response." },
          { command: "201 Created", description: "Request succeeded and a new resource was created.", example: "Response after POST /api/users creates a new user." },
          { command: "202 Accepted", description: "Request accepted for processing, but processing is not complete.", example: "Asynchronous background job queued." },
          { command: "204 No Content", description: "Request succeeded, but server sends no response payload.", example: "Successful DELETE request response." }
        ]
      },
      {
        title: "3xx Redirection",
        items: [
          { command: "301 Moved Permanently", description: "Target resource has been assigned a new permanent URI.", example: "Redirect HTTP to HTTPS permanently." },
          { command: "302 Found", description: "Resource temporarily resides under a different URI.", example: "Temporary redirect to login page." },
          { command: "304 Not Modified", description: "Resource unchanged since last request; use cached copy.", example: "Client header If-None-Match matches server ETag." },
          { command: "307 Temporary Redirect", description: "Temporary redirect preserving original HTTP method.", example: "POST request redirected without changing to GET." },
          { command: "308 Permanent Redirect", description: "Permanent redirect preserving original HTTP method.", example: "Permanent POST/PUT redirect." }
        ]
      },
      {
        title: "4xx Client Errors",
        items: [
          { command: "400 Bad Request", description: "Server cannot process request due to client error.", example: "Malformed JSON payload or missing parameters." },
          { command: "401 Unauthorized", description: "Authentication required or has failed.", example: "Missing or expired API Bearer token." },
          { command: "403 Forbidden", description: "Server understands request but refuses to authorize it.", example: "Authenticated user lacks permission for resource." },
          { command: "404 Not Found", description: "Requested resource could not be found on server.", example: "GET /api/users/99999 does not exist." },
          { command: "405 Method Not Allowed", description: "HTTP method not supported for target resource.", example: "Sending POST to a read-only endpoint." },
          { command: "409 Conflict", description: "Request conflicts with current state of target resource.", example: "Duplicate entry, e.g., registering an existing email." },
          { command: "422 Unprocessable Entity", description: "Request syntax valid, but semantic validation failed.", example: "Validation error: email field invalid format." },
          { command: "429 Too Many Requests", description: "User sent too many requests in a given time limit.", example: "Rate limit threshold exceeded." }
        ]
      },
      {
        title: "5xx Server Errors",
        items: [
          { command: "500 Internal Server Error", description: "Generic error when server encounters unexpected condition.", example: "Unhandled exception or crash in backend code." },
          { command: "502 Bad Gateway", description: "Server received invalid response from upstream server.", example: "Nginx unable to communicate with Node/Python backend." },
          { command: "503 Service Unavailable", description: "Server temporarily unable to handle request (overload/maintenance).", example: "Server down for scheduled maintenance or overloaded." },
          { command: "504 Gateway Timeout", description: "Upstream server failed to send timely response.", example: "Backend database query timeout through reverse proxy." }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------
  // DevOps
  // ---------------------------------------------------------------------
  {
    id: "docker",
    title: "Docker",
    category: "DevOps",
    sections: [
      {
        title: "Dockerfile Instructions",
        items: [
          { command: "FROM <baseimage>", description: "Set the base image for the build.", example: "FROM node:18-alpine" },
          { command: "WORKDIR /app", description: "Set the working directory inside the container.", example: "WORKDIR /usr/src/app" },
          { command: "COPY . .", description: "Copy files from host to the container image.", example: "COPY package*.json ./" },
          { command: "RUN <command>", description: "Execute shell command inside image build process.", example: "RUN npm install" },
          { command: "EXPOSE <port>", description: "Document intended port exposure.", example: "EXPOSE 8080" },
          { command: "CMD <command>", description: "Default command executed when container starts.", example: 'CMD ["node", "server.js"]' },
          { command: "ENV <key>=<value>", description: "Set environment variables inside image.", example: "ENV NODE_ENV=production" },
          { command: "ENTRYPOINT <command>", description: "Configure container executable command.", example: 'ENTRYPOINT ["python3", "app.py"]' }
        ]
      },
      {
        title: "Multistage Dockerfiles",
        items: [
          { command: "FROM <image> as builder", description: "Name the current build stage for reference later.", example: "FROM node:18 AS build" },
          { command: "FROM scratch as serve", description: "Use minimal/empty image for tiny final stage.", example: "FROM alpine:latest AS production" },
          { command: "COPY --from=builder <src> <dest>", description: "Copy compiled output from an earlier stage.", example: "COPY --from=build /app/dist /usr/share/nginx/html" }
        ]
      },
      {
        title: "Build Images",
        items: [
          { command: "docker build <path>", description: "Build image using host context path.", example: "docker build ." },
          { command: "docker build -f <file> <path>", description: "Specify a custom Dockerfile location/name.", example: "docker build -f Dockerfile.dev ." },
          { command: "docker build -t <name:tag> .", description: "Tag image with name and optional version tag.", example: "docker build -t myapp:v1.0.0 ." },
          { command: "docker image ls", description: "List all locally available Docker images.", example: "docker image ls" }
        ]
      },
      {
        title: "Run & Manage Containers",
        items: [
          { command: "docker run <image>", description: "Run container in foreground from image.", example: "docker run nginx" },
          { command: "docker run -d <image>", description: "Run container detached (in the background).", example: "docker run -d redis" },
          { command: "docker run --name <name> <image>", description: "Assign a friendly custom name to container.", example: "docker run --name my-db postgres" },
          { command: "docker ps", description: "List currently running containers.", example: "docker ps" },
          { command: "docker ps -a", description: "List all containers including stopped ones.", example: "docker ps -a" },
          { command: "docker stop <container>", description: "Stop a running container gracefully.", example: "docker stop my-app" },
          { command: "docker start <container>", description: "Start an existing stopped container.", example: "docker start my-app" },
          { command: "docker restart <container>", description: "Restart a running or stopped container.", example: "docker restart my-app" },
          { command: "docker rm <container>", description: "Remove a stopped container.", example: "docker rm my-app" },
          { command: "docker run --rm <image>", description: "Automatically remove container on exit.", example: "docker run --rm alpine echo 'Done'" }
        ]
      },
      {
        title: "Access & Execute Commands",
        items: [
          { command: "docker run -p <host>:<container> <image>", description: "Publish host port mapped to container port.", example: "docker run -p 8080:80 nginx" },
          { command: "docker exec -it <container> <cmd>", description: "Run interactive shell inside running container.", example: "docker exec -it my-app sh" },
          { command: "docker exec -it <container> bash", description: "Open bash shell inside running container.", example: "docker exec -it my-db bash" }
        ]
      },
      {
        title: "Volumes & Persistence",
        items: [
          { command: "docker run -v <name>:<path> <image>", description: "Mount named volume (managed by Docker).", example: "docker run -v db_data:/var/lib/postgresql/data postgres" },
          { command: "docker run -v <host_path>:<container_path> <image>", description: "Bind mount direct folder from host.", example: "docker run -v $(pwd):/app node" },
          { command: "docker volume ls", description: "List all existing Docker volumes.", example: "docker volume ls" },
          { command: "docker volume create <name>", description: "Create new volume independently.", example: "docker volume create app_data" },
          { command: "docker volume rm <name>", description: "Delete a specific volume.", example: "docker volume rm app_data" }
        ]
      },
      {
        title: "Logs & Inspection",
        items: [
          { command: "docker logs <container>", description: "Print stdout/stderr logs for container.", example: "docker logs my-app" },
          { command: "docker logs -f <container>", description: "Stream container logs live (follow mode).", example: "docker logs -f --tail 100 my-app" },
          { command: "docker inspect <container/image>", description: "Get low-level JSON details of container/image.", example: "docker inspect my-app" },
          { command: "docker stats", description: "Display live CPU, memory, and network usage stream.", example: "docker stats" }
        ]
      },
      {
        title: "Docker Compose",
        items: [
          { command: "docker compose up", description: "Build, create, and start services.", example: "docker compose up" },
          { command: "docker compose up -d", description: "Start services in detached background mode.", example: "docker compose up -d" },
          { command: "docker compose down", description: "Stop and remove containers, networks created by up.", example: "docker compose down" },
          { command: "docker compose down -v", description: "Stop services and purge named volumes.", example: "docker compose down -v" },
          { command: "docker compose ps", description: "List status of compose stack services.", example: "docker compose ps" },
          { command: "docker compose logs -f", description: "Stream combined logs of all stack services.", example: "docker compose logs -f web" }
        ]
      },
      {
        title: "Cleanup & Pruning",
        items: [
          { command: "docker system prune", description: "Remove all stopped containers, unused networks, and dangling images.", example: "docker system prune" },
          { command: "docker system prune -a --volumes", description: "Deep clean all unused containers, images, and volumes.", example: "docker system prune -a --volumes" },
          { command: "docker image prune", description: "Remove unused/dangling images.", example: "docker image prune" }
        ]
      }
    ]
  },
  {
    id: "kubernetes",
    title: "Kubernetes (kubectl)",
    category: "DevOps",
    sections: [
      {
        title: "Cluster & Context Info",
        items: [
          { command: "kubectl cluster-info", description: "Display cluster master and service endpoints.", example: "kubectl cluster-info" },
          { command: "kubectl config get-contexts", description: "List all available cluster contexts.", example: "kubectl config get-contexts" },
          { command: "kubectl config use-context <name>", description: "Switch active Kubernetes cluster context.", example: "kubectl config use-context prod-cluster" },
          { command: "kubectl get nodes", description: "List all nodes in the active cluster.", example: "kubectl get nodes -o wide" }
        ]
      },
      {
        title: "Pod & Resource Management",
        items: [
          { command: "kubectl get pods", description: "List all pods in default namespace.", example: "kubectl get pods -n kube-system" },
          { command: "kubectl describe pod <name>", description: "Show detailed status and event logs for a pod.", example: "kubectl describe pod my-app-pod" },
          { command: "kubectl apply -f <file.yaml>", description: "Create/update resources defined in a YAML file.", example: "kubectl apply -f deployment.yaml" },
          { command: "kubectl delete pod <name>", description: "Delete a specific pod.", example: "kubectl delete pod my-app-pod" },
          { command: "kubectl get deployments / services", description: "List deployments or services.", example: "kubectl get svc -A" }
        ]
      },
      {
        title: "Debugging & Execution",
        items: [
          { command: "kubectl logs <pod>", description: "Fetch logs from a pod container.", example: "kubectl logs -f --tail=100 my-app-pod" },
          { command: "kubectl exec -it <pod> -- <cmd>", description: "Execute interactive terminal inside running pod.", example: "kubectl exec -it my-app-pod -- sh" },
          { command: "kubectl port-forward <pod> <local>:<pod_port>", description: "Forward local port to a pod's port.", example: "kubectl port-forward pod/redis 6379:6379" }
        ]
      }
    ]
  },
  {
    id: "gitlab-ci",
    title: "GitLab CI/CD",
    category: "DevOps",
    sections: [
      {
        title: "Pipeline Structure",
        items: [
          { command: "stages:", description: "Define build stages and execution order.", example: "stages:\n  - build\n  - test\n  - deploy" },
          { command: "image:", description: "Specify Docker image to run job inside.", example: "image: node:18-alpine" },
          { command: "before_script / after_script", description: "Commands executed before or after main script runs.", example: "before_script:\n  - npm install" },
          { command: "script:", description: "Shell commands executed by the runner.", example: "script:\n  - npm run test" }
        ]
      },
      {
        title: "Rules & Artifacts",
        items: [
          { command: "rules:", description: "Define conditions for job execution.", example: "rules:\n  - if: '$CI_COMMIT_BRANCH == \"main\"'" },
          { command: "artifacts:", description: "Save build outputs/files for subsequent stages or download.", example: "artifacts:\n  paths:\n    - dist/" },
          { command: "cache:", description: "Cache dependencies across pipeline runs to speed up execution.", example: "cache:\n  key: $CI_COMMIT_REF_SLUG\n  paths:\n    - .npm/" }
        ]
      }
    ]
  },
  {
    id: "nix",
    title: "Nix",
    category: "DevOps",
    sections: flat([
      { command: "nix-shell -p pkg", description: "Drop into a shell with a package temporarily available." },
      { command: "nix-env -iA nixpkgs.pkg", description: "Imperatively install a package into your profile." },
      { command: "nix-env -q", description: "List packages installed in your profile." },
      { command: "nix-env -e pkg", description: "Remove an installed package from your profile." },
      { command: "nix-collect-garbage -d", description: "Delete old generations and free up disk space." },
      { command: "nix build", description: "Build a flake's default (or named) output." },
      { command: "nix develop", description: "Enter a flake's declared development shell." },
      { command: "nix flake update", description: "Update a flake's locked input versions." },
      { command: "nix run nixpkgs#pkg", description: "Run a package once without installing it." },
      { command: "nix search nixpkgs name", description: "Search nixpkgs for a package by name." },
      { command: "nixos-rebuild switch", description: "Apply and activate NixOS configuration changes." },
    ]),
  },

  // ---------------------------------------------------------------------
  // Docs
  // ---------------------------------------------------------------------
  {
    id: "markdown",
    title: "Markdown",
    category: "Docs",
    sections: [
      {
        title: "Headings & Formatting",
        items: [
          { command: "# H1 ... ###### H6", description: "Create headings from size 1 through 6.", example: "# Title\n## Subheading" },
          { command: "**text** or __text__", description: "Bold text emphasis.", example: "**Important note**" },
          { command: "*text* or _text_", description: "Italic text emphasis.", example: "*Italicized phrase*" },
          { command: "***text***", description: "Combined bold and italic emphasis.", example: "***Bold & Italic***" },
          { command: "~~text~~", description: "Strikethrough text.", example: "~~Deprecated feature~~" },
          { command: "> text", description: "Blockquote / Callout container.", example: "> Note: This is an important quote." },
          { command: "--- or ***", description: "Horizontal rule / divider line.", example: "---\nNew Section" }
        ]
      },
      {
        title: "Lists & Tasks",
        items: [
          { command: "* item or - item", description: "Unordered bulleted list.", example: "* Item A\n* Item B" },
          { command: "1. item", description: "Ordered numbered list.", example: "1. Step One\n2. Step Two" },
          { command: "- [ ] / - [x]", description: "Interactive task list checkboxes.", example: "- [x] Done\n- [ ] Pending" }
        ]
      },
      {
        title: "Links, Images & Code",
        items: [
          { command: "[text](url)", description: "Hyperlink inline.", example: "[Google](https://google.com)" },
          { command: "![alt](url)", description: "Embed image with alt text.", example: "![Logo](https://example.com/logo.png)" },
          { command: "`code`", description: "Inline code snippet.", example: "Use `const x = 10;` in JS" },
          { command: "```lang \\n code \\n ```", description: "Code block with language syntax highlighting.", example: "```javascript\nconsole.log('Hello');\n```" }
        ]
      },
      {
        title: "Tables (GFM)",
        items: [
          { command: "| Header | Header |", description: "Define markdown tables.", example: "| Name | Age |\n|---|---|\n| Alice | 30 |" },
          { command: "| :--- | :---: | ---: |", description: "Table column alignment (Left, Center, Right).", example: "| Left | Center | Right |\n| :--- | :---: | ---: |" }
        ]
      }
    ]
  },
  {
    id: "latex",
    title: "LaTeX",
    category: "Docs",
    sections: flat([
      { command: "\\documentclass{article}", description: "Declare the document type/class." },
      { command: "\\usepackage{package}", description: "Load a package." },
      { command: "\\begin{document} ... \\end{document}", description: "Boundaries of the document content." },
      { command: "\\section{Title}", description: "Start a new numbered section." },
      { command: "\\textbf{text} / \\textit{text}", description: "Bold / italic text." },
      { command: "\\begin{itemize} \\item ... \\end{itemize}", description: "Bulleted list." },
      { command: "\\begin{enumerate} \\item ... \\end{enumerate}", description: "Numbered list." },
      { command: "$x^2$", description: "Inline math mode." },
      { command: "\\[ x^2 \\]", description: "Display (centered, standalone) math mode." },
      { command: "\\begin{equation} ... \\end{equation}", description: "Numbered equation environment." },
      { command: "\\includegraphics{file}", description: "Insert an image (requires the graphicx package)." },
      { command: "\\label{key} / \\ref{key}", description: "Label and cross-reference a section, figure, or equation." },
      { command: "\\cite{key}", description: "Cite a bibliography entry." },
      { command: "\\begin{table} ... \\end{table}", description: "Table float environment." },
    ]),
  },
  {
    id: "redis",
    title: "Redis",
    category: "Databases & SQL",
    sections: [
      {
        title: "Keys & Connection",
        items: [
          { command: "redis-cli", description: "Open interactive CLI shell.", example: "redis-cli -h 127.0.0.1 -p 6379" },
          { command: "ping", description: "Test connection status (returns PONG).", example: "PING" },
          { command: "KEYS <pattern>", description: "Find all keys matching pattern (caution in production).", example: "KEYS user:*" },
          { command: "EXISTS <key>", description: "Check if key exists in database.", example: "EXISTS user:100" },
          { command: "DEL <key>", description: "Delete specified key.", example: "DEL session:xyz" },
          { command: "EXPIRE <key> <seconds>", description: "Set time-to-live timeout on key.", example: "EXPIRE session:xyz 3600" },
          { command: "TTL <key>", description: "Check remaining lifespan of key in seconds.", example: "TTL session:xyz" },
          { command: "FLUSHALL", description: "Delete all keys from all databases.", example: "FLUSHALL" }
        ]
      },
      {
        title: "Strings & Cache",
        items: [
          { command: "SET <key> <value>", description: "Set key string value.", example: 'SET user:name "Alice"' },
          { command: "GET <key>", description: "Retrieve stored string value.", example: "GET user:name" },
          { command: "SETEX <key> <sec> <val>", description: "Set key value with automatic expiration.", example: 'SETEX temp_token 60 "abc1234"' },
          { command: "INCR <key> / DECR <key>", description: "Atomically increment/decrement integer value.", example: "INCR page_views" },
          { command: "MGET <key1> <key2>", description: "Retrieve values of multiple keys at once.", example: "MGET user:1 user:2" }
        ]
      },
      {
        title: "Hashes (Objects)",
        items: [
          { command: "HSET <key> <field> <value>", description: "Set field in Redis hash map.", example: 'HSET user:100 name "Bob" email "bob@test.com"' },
          { command: "HGET <key> <field>", description: "Get specific field value from hash.", example: "HGET user:100 email" },
          { command: "HGETALL <key>", description: "Get all fields and values of hash map.", example: "HGETALL user:100" },
          { command: "HDEL <key> <field>", description: "Delete one or more hash fields.", example: "HDEL user:100 email" }
        ]
      },
      {
        title: "Lists & Queues",
        items: [
          { command: "LPUSH <key> <val> / RPUSH", description: "Prepend / Append value to list.", example: 'LPUSH queue:jobs "job_1"' },
          { command: "LPOP <key> / RPOP <key>", description: "Remove and return first / last list element.", example: "RPOP queue:jobs" },
          { command: "LRANGE <key> <start> <stop>", description: "Get range of elements from list.", example: "LRANGE queue:jobs 0 -1" }
        ]
      },
      {
        title: "Pub/Sub Messaging",
        items: [
          { command: "SUBSCRIBE <channel>", description: "Listen for posted messages on channel.", example: "SUBSCRIBE updates" },
          { command: "PUBLISH <channel> <msg>", description: "Post message to channel subscribers.", example: 'PUBLISH updates "New event fired"' }
        ]
      }
    ]
  },
  {
    id: "sql",
    title: "SQL Essentials",
    category: "Databases & SQL",
    sections: [
      {
        title: "Data Querying (SELECT)",
        items: [
          { command: "SELECT * FROM <table>;", description: "Fetch all columns and rows from table.", example: "SELECT * FROM users;" },
          { command: "SELECT <col1>, <col2> FROM <table>;", description: "Fetch specific columns.", example: "SELECT name, email FROM users;" },
          { command: "WHERE <condition>", description: "Filter query output rows.", example: "SELECT * FROM users WHERE status = 'active';" },
          { command: "ORDER BY <col> ASC|DESC", description: "Sort result dataset.", example: "SELECT * FROM products ORDER BY price DESC;" },
          { command: "LIMIT <N> OFFSET <M>", description: "Paginate query results.", example: "SELECT * FROM posts LIMIT 10 OFFSET 20;" },
          { command: "LIKE '%pattern%'", description: "Search for string pattern with wildcards.", example: "SELECT * FROM users WHERE email LIKE '%@gmail.com';" }
        ]
      },
      {
        title: "Joins & Combining Data",
        items: [
          { command: "INNER JOIN <table> ON <cond>", description: "Return matching rows from both tables.", example: "SELECT u.name, o.id FROM users u INNER JOIN orders o ON u.id = o.user_id;" },
          { command: "LEFT JOIN <table> ON <cond>", description: "Return all rows from left table, and matching right rows.", example: "SELECT u.name, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id;" },
          { command: "RIGHT JOIN / FULL OUTER JOIN", description: "Return all right / all combined records regardless of match.", example: "SELECT * FROM A FULL OUTER JOIN B ON A.id = B.id;" }
        ]
      },
      {
        title: "Aggregation & Grouping",
        items: [
          { command: "COUNT(), SUM(), AVG(), MIN(), MAX()", description: "Aggregate math functions.", example: "SELECT COUNT(*), AVG(salary) FROM employees;" },
          { command: "GROUP BY <col>", description: "Group rows sharing data into summary rows.", example: "SELECT department, COUNT(*) FROM employees GROUP BY department;" },
          { command: "HAVING <condition>", description: "Filter aggregate groupings (WHERE for aggregates).", example: "SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5;" }
        ]
      },
      {
        title: "Data Modification (DML)",
        items: [
          { command: "INSERT INTO <table> (cols) VALUES (vals);", description: "Insert new record into table.", example: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@test.com');" },
          { command: "UPDATE <table> SET col = val WHERE cond;", description: "Modify existing records.", example: "UPDATE users SET status = 'inactive' WHERE last_login < '2025-01-01';" },
          { command: "DELETE FROM <table> WHERE cond;", description: "Delete specific table rows.", example: "DELETE FROM logs WHERE created_at < '2024-01-01';" }
        ]
      },
      {
        title: "Schema Management (DDL)",
        items: [
          { command: "CREATE TABLE <table> (...);", description: "Define and create new database table.", example: "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));" },
          { command: "ALTER TABLE <table> ADD COLUMN ...;", description: "Modify existing table structure.", example: "ALTER TABLE users ADD COLUMN age INT;" },
          { command: "CREATE INDEX <idx_name> ON <table>(<col>);", description: "Create index to speed up querying.", example: "CREATE INDEX idx_users_email ON users(email);" },
          { command: "DROP TABLE <table>;", description: "Permanently delete table and data.", example: "DROP TABLE temp_data;" }
        ]
      }
    ]
  },
  {
    id: "mongodb",
    title: "MongoDB",
    category: "Databases & SQL",
    sections: [
      {
        title: "mongosh Basics",
        items: [
          { command: "show dbs", description: "List available databases.", example: "show dbs" },
          { command: "use <dbname>", description: "Switch active database context.", example: "use app_production" },
          { command: "show collections", description: "List all collections in active database.", example: "show collections" }
        ]
      },
      {
        title: "CRUD Operations",
        items: [
          { command: "db.coll.insertOne({...})", description: "Insert a single document into collection.", example: 'db.users.insertOne({ name: "Alice", role: "admin" })' },
          { command: "db.coll.find({filter})", description: "Query documents in collection.", example: 'db.users.find({ role: "admin" }).pretty()' },
          { command: "db.coll.updateOne({filter}, {$set: {...}})", description: "Update matching document values.", example: 'db.users.updateOne({ name: "Alice" }, { $set: { active: true } })' },
          { command: "db.coll.deleteOne({filter})", description: "Remove document matching filter criteria.", example: 'db.users.deleteOne({ active: false })' }
        ]
      },
      {
        title: "Indexes & Aggregation",
        items: [
          { command: "db.coll.createIndex({field: 1})", description: "Create index on field (1 for ASC, -1 for DESC).", example: "db.users.createIndex({ email: 1 }, { unique: true })" },
          { command: "db.coll.aggregate([...])", description: "Run data processing pipeline.", example: 'db.orders.aggregate([{ $match: { status: "completed" } }, { $group: { _id: "$userId", total: { $sum: "$amount" } } }])' }
        ]
      }
    ]
  },
  {
    id: "database-cli",
    title: "Database CLIs (PostgreSQL & MySQL)",
    category: "Databases & SQL",
    sections: [
      {
        title: "PostgreSQL (psql)",
        items: [
          { command: "psql -U <user> -d <db>", description: "Connect to PostgreSQL server.", example: "psql -U postgres -d my_app" },
          { command: "\\l", description: "List all available databases.", example: "\\l" },
          { command: "\\c <dbname>", description: "Connect / switch to a database.", example: "\\c my_app" },
          { command: "\\dt", description: "List all tables in current database schema.", example: "\\dt" },
          { command: "\\d <table>", description: "Describe table schema, columns, and indexes.", example: "\\d users" },
          { command: "\\q", description: "Quit psql CLI shell.", example: "\\q" }
        ]
      },
      {
        title: "MySQL / MariaDB CLI",
        items: [
          { command: "mysql -u <user> -p", description: "Connect to MySQL CLI with password prompt.", example: "mysql -u root -p" },
          { command: "SHOW DATABASES;", description: "List all databases on server.", example: "SHOW DATABASES;" },
          { command: "USE <dbname>;", description: "Select database context.", example: "USE app_prod;" },
          { command: "SHOW TABLES;", description: "List tables inside selected database.", example: "SHOW TABLES;" },
          { command: "DESCRIBE <table>;", description: "Display column definitions of table.", example: "DESCRIBE users;" },
          { command: "mysqldump -u <user> -p <db> > dump.sql", description: "Dump database schema and data to SQL file.", example: "mysqldump -u root -p app_prod > backup.sql" }
        ]
      }
    ]
  }
];
