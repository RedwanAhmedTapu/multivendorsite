import { Icon } from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type MenuItem = {
  title: string;
  href: string;
  icon: IconType;
  color?: string;
  subItems?: MenuItem[];
};

type SidebarSection = {
  title?: string;
  items: MenuItem[];
};

type FlatMenuItem = {
  title: string;
  href: string;
  icon: IconType;
  keywords: string[];
};

export const flattenMenuItems = (sections: SidebarSection[]): FlatMenuItem[] => {
  const flat: FlatMenuItem[] = [];

  const addItem = (title: string, href: string, icon: IconType, parentTitle?: string) => {
    const baseKeywords = [
      title.toLowerCase(),
      ...title.toLowerCase().split(" "),
    ];
    if (parentTitle) {
      baseKeywords.push(parentTitle.toLowerCase());
      baseKeywords.push(...parentTitle.toLowerCase().split(" "));
    }
    
    // Add additional common keywords
    const commonKeywords = [
      "menu", "page", "section", "panel", "dashboard", 
      "manage", "view", "list", "add", "edit"
    ];
    
    flat.push({
      title,
      href,
      icon,
      keywords: [...new Set([...baseKeywords, ...commonKeywords])],
    });
  };

  sections.forEach((section) => {
    section.items.forEach((item) => {
      // Add parent item
      const effectiveHref =
        item.href !== "#" ? item.href : item.subItems?.[0]?.href || "#";

      addItem(item.title, effectiveHref, item.icon, section.title);

      // Add all sub-items
      item.subItems?.forEach((sub) => {
        addItem(sub.title, sub.href, sub.icon, item.title);
      });
    });
  });

  return flat;
};