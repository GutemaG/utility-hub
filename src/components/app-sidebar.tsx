import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Calculation",
      url: "#",
      items: [
        {
          title: "Tax Calculation",
          url: "/tax-calculation",
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
          url: "/tempratur-conversion",
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
          title: "Age & Date Convertors",
          url: "/age-and-date-convertors",
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
        }
      ]
    }

  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
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
            {data.navMain.map((item) => (
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
                        <SidebarMenuSubButton asChild isActive={item.url === window.location.pathname}>
                          <a href={item.url}>{item.title}</a>
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
      <SidebarRail />
    </Sidebar>
  )
}
