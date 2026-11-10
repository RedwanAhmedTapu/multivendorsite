"use client";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetLastLoginQuery,
  useGetLoginHistoryQuery,
  LoginHistoryEntry,
} from "@/features/authApi";
import {
  User,
  Mail,
  Phone,
  Shield,
  Fingerprint,
  Globe,
  Monitor,
  Smartphone,
  Clock,
  MapPin,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  CalendarDays,
} from "lucide-react";

/* ─── Shared primitives (same visual language as ProductForm) ──────────── */

function SectionCard({
  icon,
  title,
  subtitle,
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
  children,
  headerRight,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${accentBorder}`,
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: `0.5px solid ${accentBorder}`,
          background: accentBg,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "#fff",
              border: `0.5px solid ${accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: accent,
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {headerRight}
      </div>
      <div style={{ padding: "18px 18px" }}>{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
  accent = "#1D4ED8",
  emptyText = "—",
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  mono?: boolean;
  accent?: string;
  emptyText?: string;
}) {
  const display = value || emptyText;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: "0.5px solid #F0F4FA",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: `${accent}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: value ? "#0D1B2E" : "#CBD5E1",
            fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
            wordBreak: "break-all",
            lineHeight: 1.4,
          }}
        >
          {display}
        </div>
      </div>
    </div>
  );
}

function Pill({
  text,
  color = "#1D4ED8",
  bg = "#EFF6FF",
  border = "#BFDBFE",
}: {
  text: string;
  color?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 9px",
        borderRadius: 20,
        color,
        background: bg,
        border: `0.5px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(iso);
}

/* ─── Device icon helper ────────────────────────────────────────────────── */

function DeviceIcon({ platform, size = 14 }: { platform?: string | null; size?: number }) {
  const p = (platform || "").toLowerCase();
  if (p.includes("android")) return <Smartphone size={size} color="#15803D" />;
  if (p.includes("ios") || p.includes("iphone") || p.includes("ipad"))
    return <Smartphone size={size} color="#1D4ED8" />;
  return <Monitor size={size} color="#64748B" />;
}

/* ─── Main Component ───────────────────────────────────────────────────── */

export default function VendorInfoPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: lastLoginData, isLoading: lastLoginLoading } =
    useGetLastLoginQuery();
  const { data: historyData, isLoading: historyLoading } =
    useGetLoginHistoryQuery({ page: 1, pageSize: 10 });

  const lastLogin = lastLoginData?.lastLogin ?? null;
  const historyItems: LoginHistoryEntry[] = historyData?.items ?? [];
  const totalLogins = historyData?.total ?? 0;

  const successCount = useMemo(
    () => historyItems.filter((h) => h.success).length,
    [historyItems]
  );
  const failCount = useMemo(
    () => historyItems.filter((h) => !h.success).length,
    [historyItems]
  );

  const initials = useMemo(() => {
    const n = user?.name || "V";
    return n
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
        padding: "24px 0 48px",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ── Page header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#0D1B2E",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              Vendor Profile
            </h1>
            <p style={{ fontSize: 12.5, color: "#7A90AB", margin: 0 }}>
              Account information and security overview
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ROW 1 — Profile card + Last login (side by side on desktop)
            ══════════════════════════════════════════════════════════════════ */}
        <div
          className="info-row-1"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* ── Profile Details ── */}
          <SectionCard
            icon={<User size={15} color="#1D4ED8" />}
            title="Profile Details"
            subtitle="Basic account information"
            accent="#1D4ED8"
            accentBg="#EFF6FF"
            accentBorder="#BFDBFE"
            headerRight={
              <Pill
                text={user?.role || "VENDOR"}
                color="#7C3AED"
                bg="#F5F3FF"
                border="#C4B5FD"
              />
            }
          >
            <div>
              <InfoRow
                icon={<User size={13} color="#1D4ED8" />}
                label="Full Name"
                value={user?.name}
              />
              <InfoRow
                icon={<Mail size={13} color="#0891B2" />}
                label="Email Address"
                value={user?.email}
                mono
              />
              <InfoRow
                icon={<Phone size={13} color="#15803D" />}
                label="Phone Number"
                value={user?.phone}
                mono
              />
              <InfoRow
                icon={<Shield size={13} color="#7C3AED" />}
                label="Vendor ID"
                value={user?.vendorId}
                mono
              />
              <InfoRow
                icon={<KeyRound size={13} color="#0369A1" />}
                label="User ID"
                value={user?.id}
                mono
              />
              {/* Remove last border */}
              <div style={{ height: 10 }} />
            </div>
          </SectionCard>

          {/* ── Last Login ── */}
          <SectionCard
            icon={<Fingerprint size={15} color="#7C3AED" />}
            title="Last Login"
            subtitle="Most recent successful authentication"
            accent="#7C3AED"
            accentBg="#F5F3FF"
            accentBorder="#C4B5FD"
            headerRight={
              lastLogin ? (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#7C3AED",
                    background: "#F5F3FF",
                    border: "0.5px solid #C4B5FD",
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  {timeAgo(lastLogin.loginAt)}
                </span>
              ) : null
            }
          >
            {lastLoginLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 0",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                <Clock size={14} style={{ animation: "spin 1s linear infinite", marginRight: 8 }} />
                Loading…
              </div>
            ) : lastLogin ? (
              <div>
                <InfoRow
                  icon={<DeviceIcon platform={lastLogin.platform} size={13} />}
                  label="Device"
                  value={lastLogin.deviceName || lastLogin.device}
                  accent="#7C3AED"
                />
                <InfoRow
                  icon={<Globe size={13} color="#0891B2" />}
                  label="Browser"
                  value={`${lastLogin.browser}${lastLogin.os ? ` on ${lastLogin.os}` : ""}`}
                  accent="#7C3AED"
                />
                <InfoRow
                  icon={<MapPin size={13} color="#DC2626" />}
                  label="IP Address"
                  value={lastLogin.ipAddress}
                  mono
                  accent="#7C3AED"
                />
                <InfoRow
                  icon={<CalendarDays size={13} color="#0369A1" />}
                  label="Login Time"
                  value={formatDateTime(lastLogin.loginAt)}
                  accent="#7C3AED"
                />
                <InfoRow
                  icon={<Fingerprint size={13} color="#7C3AED" />}
                  label="Method"
                  value={lastLogin.method}
                  accent="#7C3AED"
                />
                <div style={{ height: 10 }} />
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "28px 0",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                <Fingerprint
                  size={28}
                  color="#E2E8F0"
                  style={{ margin: "0 auto 10px", display: "block" }}
                />
                No login history yet
              </div>
            )}
          </SectionCard>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ROW 2 — Quick stats
            ══════════════════════════════════════════════════════════════════ */}
        <div
          className="info-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              label: "Total Logins",
              value: totalLogins,
              icon: <Fingerprint size={16} color="#1D4ED8" />,
              bg: "#EFF6FF",
              border: "#BFDBFE",
              color: "#1D4ED8",
            },
            {
              label: "Successful",
              value: successCount,
              icon: <CheckCircle2 size={16} color="#059669" />,
              bg: "#F0FDF4",
              border: "#BBF7D0",
              color: "#059669",
            },
            {
              label: "Failed",
              value: failCount,
              icon: <AlertTriangle size={16} color="#DC2626" />,
              bg: "#FEF2F2",
              border: "#FECACA",
              color: "#DC2626",
            },
            {
              label: "Auth Method",
              value: lastLogin?.method || "PASSWORD",
              icon: <KeyRound size={16} color="#7C3AED" />,
              bg: "#F5F3FF",
              border: "#C4B5FD",
              color: "#7C3AED",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#fff",
                border: `1px solid ${stat.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: stat.color,
                    lineHeight: 1.2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ROW 3 — Login History Table
            ══════════════════════════════════════════════════════════════════ */}
        <SectionCard
          icon={<Clock size={15} color="#0369A1" />}
          title="Login History"
          subtitle={`Showing recent ${historyItems.length} of ${totalLogins} entries`}
          accent="#0369A1"
          accentBg="#F0F9FF"
          accentBorder="#BAE6FD"
          headerRight={
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "#0369A1",
                background: "#F0F9FF",
                border: "0.5px solid #BAE6FD",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              Page {historyData?.page ?? 1} of{" "}
              {historyData?.totalPages ?? 1}
            </span>
          }
        >
          {historyLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0",
                color: "#94A3B8",
                fontSize: 13,
              }}
            >
              <Clock size={14} style={{ animation: "spin 1s linear infinite", marginRight: 8 }} />
              Loading history…
            </div>
          ) : historyItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#94A3B8",
                fontSize: 13,
              }}
            >
              <Clock
                size={28}
                color="#BAE6FD"
                style={{ margin: "0 auto 10px", display: "block" }}
              />
              No login history yet
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #BAE6FD",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Status",
                        "Device",
                        "Browser / OS",
                        "IP Address",
                        "Method",
                        "Time",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#0369A1",
                            background: "#F0F9FF",
                            borderBottom: "1px solid #BAE6FD",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        style={{
                          background:
                            idx % 2 === 0 ? "#fff" : "#F8FAFC",
                        }}
                      >
                        {/* Status */}
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "0.5px solid #E2E8F0",
                          }}
                        >
                          {entry.success ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#059669",
                                background: "#D1FAE5",
                                border: "0.5px solid #6EE7B7",
                                padding: "2px 8px",
                                borderRadius: 20,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                              }}
                            >
                              <CheckCircle2 size={10} />
                              Success
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#DC2626",
                                background: "#FEF2F2",
                                border: "0.5px solid #FCA5A5",
                                padding: "2px 8px",
                                borderRadius: 20,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                              }}
                              title={entry.failureReason || undefined}
                            >
                              <AlertTriangle size={10} />
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Device */}
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "0.5px solid #E2E8F0",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <DeviceIcon
                              platform={entry.platform}
                              size={13}
                            />
                            <span style={{ fontWeight: 500 }}>
                              {entry.deviceName || entry.device}
                            </span>
                          </div>
                        </td>

                        {/* Browser / OS */}
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "0.5px solid #E2E8F0",
                            color: "#475569",
                            fontSize: 12.5,
                          }}
                        >
                          {entry.browser}
                          {entry.os ? (
                            <span style={{ color: "#94A3B8" }}>
                              {" "}
                              · {entry.os}
                            </span>
                          ) : null}
                        </td>

                        {/* IP */}
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "0.5px solid #E2E8F0",
                            fontFamily:
                              "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "#64748B",
                          }}
                        >
                          {entry.ipAddress}
                        </td>

                        {/* Method */}
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "0.5px solid #E2E8F0",
                          }}
                        >
                          <Pill
                            text={entry.method}
                            color={
                              entry.method === "WEBAUTHN"
                                ? "#7C3AED"
                                : entry.method === "SOCIAL"
                                  ? "#0891B2"
                                  : "#1D4ED8"
                            }
                            bg={
                              entry.method === "WEBAUTHN"
                                ? "#F5F3FF"
                                : entry.method === "SOCIAL"
                                  ? "#F0FDFA"
                                  : "#EFF6FF"
                            }
                            border={
                              entry.method === "WEBAUTHN"
                                ? "#C4B5FD"
                                : entry.method === "SOCIAL"
                                  ? "#5EEAD4"
                                  : "#BFDBFE"
                            }
                          />
                        </td>

                        {/* Time */}
                        <td
                          style={{
                            padding: "10px 14px",
                            borderBottom: "0.5px solid #E2E8F0",
                            fontSize: 12,
                            color: "#64748B",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div>{formatDateTime(entry.loginAt)}</div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "#94A3B8",
                              marginTop: 1,
                            }}
                          >
                            {timeAgo(entry.loginAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 768px) {
            .info-row-1 { grid-template-columns: 1fr !important; }
            .info-stats { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 480px) {
            .info-stats { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}