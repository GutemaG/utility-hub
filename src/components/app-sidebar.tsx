import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
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
  // Add the size prop definition here 👇
  size?: "sm" | "md" | "lg" 
}

export function SidebarLink({ item, className, size = "md" }: SidebarLinkProps) {
  return (
    <Link
      to={item.url}
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

// This is sample data.
const data = {
  navMain: [
    {
      title: "Calculation",
      url: "#",
      items: [
        {
          title: "Salary Calculation",
          url: "/salary-calculation",
        },
        {
          title: "Payroll Generator",
          url: "/payroll-generator",
        },
        {
          title: "BMI Calculation",
          url: "/bmi-calculation",
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
        },
        {
          title: "Temperature Conversion",
          url: "/temperature-conversion",
        },
        {
          title: "Shoe Size Conversion",
          url: "/shoe-size-conversion",
        },
        {
          title: "Weight Conversion",
          url: "/weight-conversion",
        },

        {
          title: "Area Conversion",
          url: "/area-conversion",
        },
        {
          title: "Speed Conversion",
          url: "/speed-conversion",
        },
        {
          title: "Data Storage Conversion",
          url: "/data-storage-conversion",
        },
        {
          title: "Time Conversion",
          url: "/time-conversion",
        },
        {
          title: "Ethiopian Date Convertors",
          url: "/age-and-date-convertors",
        },
        // {
        //   title: "Ethiopian Calendar",
        //   url: "/ethiopian-calendar",
        // },
      ],
    },
    {
      title: "Other",
      url: "#",
      items: [
        {
          title: "Password Generator",
          url: "/password-generator",
        },

        {
          title: "UUID Generator",
          url: "/uuid-generator",
        },

        {
          title: "QR Code Generator",
          url: "/qr-code-generator",
        },
        {
          title: "Markdown Editor",
          url: "/mark-down-editor",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [sidebarItems, setSidebarItems] = React.useState(data.navMain);
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    if (!filter) {
      setSidebarItems(data.navMain);
      return;
    }
    const lowerFilter = filter.toLowerCase();
    const filtered = data.navMain
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
      .filter((group): group is (typeof data.navMain)[0] => group !== null); // Type guard to filter out nulls
    setSidebarItems(filtered);
  }, [filter]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Utility Hub</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <Input
              onClick={(e) => e.stopPropagation()}
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          asChild
                          // isActive={item.url === window.location.pathname}
                        >
                          <SidebarLink item={item} size="sm" />
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
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
