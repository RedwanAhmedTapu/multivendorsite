"use client";

import { useRouter } from "next/navigation";
import {
  User,
  IdCard,
  Settings2,
  Landmark,
  Percent,
  Warehouse,
  Truck,
  Ship,
  Receipt,
  Users,
  ShieldCheck,
  MessageSquareQuote,
  MessageSquareReply,
  Bell,
  Tags,
  BellRing,
  Trophy,
  LucideIcon,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type SettingsCard = {
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  iconBg: string; // gradient background for the icon chip
};

type SettingsGroup = {
  title: string;
  cards: SettingsCard[];
};

/* ─── Data ───────────────────────────────────────────────────────────────── */
/* Update the `href` values to match your actual route names once confirmed. */

const GROUPS: SettingsGroup[] = [
  {
    title: "Business Information",
    cards: [
      {
        title: "Seller Profile",
        subtitle: "Manage seller profile",
        href: "/vendor-dashboard/settings/profile-settings",
        icon: User,
        iconBg: "linear-gradient(135deg,#60A5FA,#3B82F6)",
      },
      {
        title: "Document Settinsgs",
        subtitle: "Your identity info",
        href: "/vendor-dashboard/settings/document-settings",
        icon: IdCard,
        iconBg: "linear-gradient(135deg,#38BDF8,#0EA5E9)",
      },
      {
        title: "Account Setting",
        subtitle: "Manage login account",
        href: "/vendor-dashboard/settings/authsettings",
        icon: Settings2,
        iconBg: "linear-gradient(135deg,#22D3EE,#06B6D4)",
      },
    ],
  },
  {
    title: "Finance",
    cards: [
      {
        title: "Payment Account",
        subtitle: "Manage Payment account",
        href: "/vendor-dashboard/settings/payment-settings",
        icon: Landmark,
        iconBg: "linear-gradient(135deg,#FB7185,#F43F5E)",
      },
      {
        title: "Commission",
        subtitle: "Manage commission",
        href: "/vendor-dashboard/settings/commission",
        icon: Percent,
        iconBg: "linear-gradient(135deg,#FB7185,#E11D48)",
      },
    ],
  },
  {
    title: "Logistic",
    cards: [
      {
        title: "Warehouse",
        subtitle: "Your delivery address",
        href: "/vendor-dashboard/settings/warehouse-settings",
        icon: Warehouse,
        iconBg: "linear-gradient(135deg,#818CF8,#6366F1)",
      },
      // {
      //   title: "Delivery Service",
      //   subtitle: "Manage delivery service",
      //   href: "/vendor-dashboard/settings/delivery-service",
      //   icon: Truck,
      //   iconBg: "linear-gradient(135deg,#818CF8,#4F46E5)",
      // },
      // {
      //   title: "Shipping Provider",
      //   subtitle: "Manage shipping provider",
      //   href: "/vendor-dashboard/settings/shipping-provider",
      //   icon: Ship,
      //   iconBg: "linear-gradient(135deg,#A78BFA,#7C3AED)",
      // },
      // {
      //   title: "Invoice Number",
      //   subtitle: "Manage invoice number",
      //   href: "/vendor-dashboard/settings/invoice-number",
      //   icon: Receipt,
      //   iconBg: "linear-gradient(135deg,#A78BFA,#8B5CF6)",
      // },
    ],
  },
  {
    title: "User Management",
    cards: [
      {
        title: "Manage Users",
        subtitle: "Manage sub accounts",
        href: "/vendor-dashboard/settings/users",
        icon: Users,
        iconBg: "linear-gradient(135deg,#34D399,#10B981)",
      },
      {
        title: "Manage Roles",
        subtitle: "Manage your login email/phone/password",
        href: "/vendor-dashboard/settings/authsettings",
        icon: ShieldCheck,
        iconBg: "linear-gradient(135deg,#2DD4BF,#14B8A6)",
      },
    ],
  },
  {
    title: "Chat",
    cards: [
      {
        title: "Quick Reply",
        subtitle: "Manage quick reply",
        href: "/vendor-dashboard/chat/quick-reply",
        icon: MessageSquareQuote,
        iconBg: "linear-gradient(135deg,#38BDF8,#0EA5E9)",
      },
      {
        title: "Auto Reply",
        subtitle: "Manage auto reply",
        href: "/vendor-dashboard/chat/auto-reply",
        icon: MessageSquareReply,
        iconBg: "linear-gradient(135deg,#38BDF8,#0284C7)",
      },
      {
        title: "Notification",
        subtitle: "Manage chat notification",
        href: "/vendor-dashboard/chat/notification",
        icon: Bell,
        iconBg: "linear-gradient(135deg,#60A5FA,#2563EB)",
      },
      {
        title: "Chat Keyword Tag",
        subtitle: "Manage chat keyword tag",
        href: "/vendor-dashboard/chat/keyword-tag",
        icon: Tags,
        iconBg: "linear-gradient(135deg,#22D3EE,#0891B2)",
      },
    ],
  },
  {
    title: "System",
    cards: [
      {
        title: "Notification Settings",
        subtitle: "Receive notification according to your preferences",
        href: "/vendor-dashboard/settings/notifications",
        icon: BellRing,
        iconBg: "linear-gradient(135deg,#FBBF24,#F59E0B)",
      },
    ],
  },
  {
    title: "Other",
    cards: [
      {
        title: "Intellectual Property Protection",
        subtitle: "Intellectual property complaints",
        href: "/vendor-dashboard/settings/ip-protection",
        icon: Trophy,
        iconBg: "linear-gradient(135deg,#FB923C,#F97316)",
      },
    ],
  },
];

/* ─── Card ───────────────────────────────────────────────────────────────── */

function SettingsCardItem({ card }: { card: SettingsCard }) {
  const router = useRouter();
  const Icon = card.icon;

  return (
    <button
      onClick={() => router.push(card.href)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "#F5F6FB",
        border: "1px solid transparent",
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "background 0.15s, border-color 0.15s, transform 0.1s",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#ECEEFB";
        e.currentTarget.style.borderColor = "#C7D2FE";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#F5F6FB";
        e.currentTarget.style.borderColor = "transparent";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.99)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: card.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#64748B",
            lineHeight: 1.4,
            marginTop: 1,
          }}
        >
          {card.subtitle}
        </div>
      </div>
    </button>
  );
}

/* ─── Group ──────────────────────────────────────────────────────────────── */

function SettingsGroupSection({ group }: { group: SettingsGroup }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#0F172A",
          margin: "0 0 12px",
        }}
      >
        {group.title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        {group.cards.map((card) => (
          <SettingsCardItem key={card.title} card={card} />
        ))}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function VendorSettingsHub() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {GROUPS.map((group) => (
        <SettingsGroupSection key={group.title} group={group} />
      ))}
    </div>
  );
}