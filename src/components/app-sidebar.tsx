import * as React from "react";
import { Keyboard, Star } from "lucide-react";
import { navigationGroups } from "@/config/navigation";
import {
  getToolPreferences,
  subscribeToolPreferences,
  toggleFavoriteTool,
} from "@/lib/tool-preferences";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "./ui/input";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";


interface SidebarLinkProps {
  item: {
    url: string
    title: string
  }
  className?: string
  size?: "sm" | "md" | "lg" 
  onSelect?: () => void
}

export function SidebarLink({ item, className, size = "md", onSelect }: SidebarLinkProps) {
  return (
    <Link
      to={item.url}
      onClick={onSelect}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 transition-all",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
        "hover:not-.active:font-medium",
        "[&.active]:bg-sidebar-ring [&.active]:text-sidebar-accent-foreground [&.active]:font-medium"
      )}
    >
      {item.title}
    </Link>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [sidebarItems, setSidebarItems] = React.useState(navigationGroups);
  const [filter, setFilter] = React.useState("");
  const [preferences, setPreferences] = React.useState(getToolPreferences);

  const toolsByUrl = React.useMemo(
    () =>
      new Map(
        navigationGroups.flatMap((group) =>
          group.items.map((item) => [item.url, item] as const)
        )
      ),
    []
  );

  const closeMobileSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  React.useEffect(() => {
    setPreferences(getToolPreferences());
    return subscribeToolPreferences(() => {
      setPreferences(getToolPreferences());
    });
  }, []);

  React.useEffect(() => {
    if (!filter) {
      setSidebarItems(navigationGroups);
      return;
    }
    const lowerFilter = filter.toLowerCase();
    const filtered = navigationGroups
      .map((group) => {
        const matchedItems = group.items?.filter((item) =>
          item.title.toLowerCase().includes(lowerFilter)
        );
        if (group.title.toLowerCase().includes(lowerFilter)) {
          return group; // Include entire group if group title matches
        }
        if (matchedItems && matchedItems.length > 0) {
          return { ...group, items: matchedItems }; // Include only matched items
        }
        return null; // Exclude group if no matches
      })
      .filter((group): group is (typeof navigationGroups)[0] => group !== null); // Type guard to filter out nulls
    setSidebarItems(filtered);
  }, [filter]);

  const quickSections = React.useMemo(() => {
    const toItems = (urls: string[]) =>
      urls
        .map((url) => toolsByUrl.get(url))
        .filter((item): item is NonNullable<(typeof navigationGroups)[number]["items"][number]> => Boolean(item));

    const favorites = toItems(preferences.favorites);
    const sections = [{ title: "Favorites", items: favorites }];

    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) {
      return sections.filter((section) => section.items.length > 0);
    }

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.title.toLowerCase().includes(normalizedFilter)),
      }))
      .filter((section) => section.items.length > 0);
  }, [filter, preferences.favorites, toolsByUrl]);

  const toggleFavorite = React.useCallback((url: string) => {
    toggleFavoriteTool(url);
  }, []);

  const isFavorite = React.useCallback(
    (url: string) => preferences.favorites.includes(url),
    [preferences.favorites]
  );

  const renderToolItem = React.useCallback(
    (item: { url: string; title: string }) => (
      <SidebarMenuSubItem key={item.url}>
        <div className="group relative">
          <SidebarLink item={item} size="sm" onSelect={closeMobileSidebar} className="pr-8" />
          <SidebarMenuAction
            aria-label={isFavorite(item.url) ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
            title={isFavorite(item.url) ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "top-1 h-5 w-5",
              isFavorite(item.url)
                ? "text-amber-500 opacity-100"
                : isMobile
                  ? "text-sidebar-foreground/70 opacity-100"
                  : "text-sidebar-foreground/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleFavorite(item.url);
            }}
          >
            <Star className={cn("h-3.5 w-3.5", isFavorite(item.url) && "fill-current")} />
          </SidebarMenuAction>
        </div>
      </SidebarMenuSubItem>
    ),
    [closeMobileSidebar, isFavorite, toggleFavorite]
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" onClick={closeMobileSidebar}>
                <div className="bg-sidebar-primary/15 flex aspect-square size-8 items-center justify-center rounded-lg border border-sidebar-border">
                  <img
                    src="/logo.png"
                    alt="Utility Hub logo"
                    className="size-6 rounded-sm object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Utility Hub</span>
                  <span className="">v1.0.1</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
              <Keyboard className="h-4 w-4" />
              <span>Ctrl/Cmd + K</span>
            </div>
            <Input
              onClick={(e) => e.stopPropagation()}
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {quickSections.map((section) => (
              <SidebarMenuItem key={section.title}>
                <SidebarMenuButton asChild>
                  <span className="font-medium">{section.title}</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {section.items.map((item) => renderToolItem(item))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            ))}
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => renderToolItem(subItem))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="w-full text-center py-3">
          <a
            href="https://github.com/GutemaG/utility-hub/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            💬 Support & Feedback (GitHub Issues)
          </a>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
