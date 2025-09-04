"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type MenuItem = {
  title: string;
  href: string;
  icon: Icon;
  color?: string;
  subItems?: MenuItem[];
};

type SidebarSection = {
  title?: string;
  items: MenuItem[];
};

type SidebarProps = {
  logo: {
    icon: Icon;
    title: string;
    subtitle: string;
    iconBgColor?: string;
  };
  sections: SidebarSection[];
  footer: {
    user: {
      name: string;
      email: string;
      avatar?: string;
    };
    logoutAction: () => void;
  };
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({
  logo,
  sections,
  footer,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-teal-900 shadow-lg w-64 text-white">
      {/* Logo / Header */}
      <div className="flex items-center gap-3 p-4 border-b border-teal-800">
        <div className={`p-2 ${logo.iconBgColor || "bg-teal-800"} rounded-lg`}>
          <logo.icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{logo.title}</h2>
          <p className="text-xs text-teal-300">{logo.subtitle}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <div className="px-4 pb-2 text-xs uppercase font-medium tracking-wider text-teal-300">
                {section.title}
              </div>
            )}
            <div className="flex flex-col">
              {section.items.map((item, idx) =>
                item.subItems ? (
                  <div key={idx}>
                    <button
                      className="flex items-center justify-between w-full px-4 py-2 rounded-md hover:bg-teal-800 transition-colors"
                      onClick={() => toggleGroup(item.title)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`h-5 w-5 ${item.color || "text-teal-200"}`}
                        />
                        <span className="text-sm">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-teal-300 transition-transform ${
                          openGroups[item.title] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {openGroups[item.title] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {item.subItems.map((subItem, subIdx) => (
                            <Link
                              key={subIdx}
                              href={subItem.href}
                              className="flex items-center gap-3 px-12 py-2 rounded-md hover:bg-teal-800 text-teal-200 transition-colors"
                              onClick={onClose}
                            >
                              <subItem.icon
                                className={`h-4 w-4 ${subItem.color || "text-teal-300"}`}
                              />
                              <span className="text-sm">{subItem.title}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={idx}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-teal-800 text-teal-200 transition-colors"
                    onClick={onClose}
                  >
                    <item.icon
                      className={`h-5 w-5 ${item.color || "text-teal-200"}`}
                    />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-teal-800 flex items-center gap-3 bg-teal-900">
        <div className="h-9 w-9 rounded-full bg-teal-800 flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{footer.user.name}</div>
          <div className="text-xs text-teal-300 truncate">{footer.user.email}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-teal-200 hover:text-white hover:bg-teal-800"
          onClick={footer.logoutAction}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  // Mobile sidebar overlay
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="fixed inset-0 z-50 flex md:hidden"
          >
            {sidebarContent}
            <div className="flex-1 bg-black/30" onClick={onClose}></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">{sidebarContent}</div>
    </>
  );
}
