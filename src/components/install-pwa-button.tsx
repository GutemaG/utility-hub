import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type InstallOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const ua = window.navigator.userAgent;

    const isIosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isSafariBrowser =
      /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua);

    setIsIosSafari(isIosDevice && isSafariBrowser);

    const updateInstalledState = () => {
      const standaloneOnIos =
        "standalone" in window.navigator &&
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

      setIsInstalled(mediaQuery.matches || standaloneOnIos);
    };

    updateInstalledState();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    mediaQuery.addEventListener("change", updateInstalledState);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      mediaQuery.removeEventListener("change", updateInstalledState);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsPrompting(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } finally {
      setIsPrompting(false);
    }
  };

  if (isInstalled || !deferredPrompt) {
    if (!isInstalled && isIosSafari) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-full px-3"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Install</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3 text-sm">
            <p className="font-medium">Install on iPhone/iPad</p>
            <p className="mt-1 text-muted-foreground">
              Open Safari Share menu, then choose Add to Home Screen.
            </p>
          </PopoverContent>
        </Popover>
      );
    }

    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 rounded-full px-3"
      onClick={() => {
        void handleInstallClick();
      }}
      disabled={isPrompting}
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">Install</span>
    </Button>
  );
}
