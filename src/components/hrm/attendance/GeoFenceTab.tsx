// src/components/hrm/attendance/GeoFenceTab.tsx
//
// Geo-Fence tab: info card, branch geo-fence configuration table (from
// real branch data), and a punch simulator that evaluates the employee's
// branch geo-fence via POST /hrm/attendance/geo-simulate — the SAME
// server-side haversine validation the real punch uses, without writing
// any attendance record.

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGetBranchesQuery, useGetEmployeesQuery, useGeoSimulateMutation } from "@/features/hrmApi";
import type { GeoSimulateResult } from "@/features/hrmApi";
import { toArray } from "../hrm-utils";

export function HrmAttendanceGeoFence() {
  const branches = useGetBranchesQuery();
  const { data: employeesData } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const [geoSimulate, { isLoading: simulating }] = useGeoSimulateMutation();

  const [mode, setMode] = useState<"in" | "out">("in");
  const [employeeId, setEmployeeId] = useState("");
  const [lat, setLat] = useState("23.7925");
  const [lng, setLng] = useState("90.4078");
  const [accuracy, setAccuracy] = useState("25");
  const [result, setResult] = useState<GeoSimulateResult | null>(null);

  const branchList = toArray(branches?.data);

  async function simulate() {
    if (!employeeId) { toast.error("Select an employee."); return; }
    try {
      const res = await geoSimulate({
        employeeId,
        mode: mode === "in" ? "CHECK_IN" : "CHECK_OUT",
        latitude: Number(lat),
        longitude: Number(lng),
        accuracy: accuracy.trim() === "" ? undefined : Number(accuracy),
      }).unwrap();
      setResult(res.data);
      if (res.data.allowed) toast.success(res.data.message);
      else toast.error(res.data.message);
    } catch (err: any) {
      toast.error(err?.data?.message ?? err?.message ?? "Simulation failed.");
    }
  }

  return (
    <div>
      {/* Info card */}
      <div className="hrm-card p-5 mb-5">
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: "0 0 8px" }}>How geo-fence attendance works</h2>
        <ul style={{ fontSize: 12.5, color: "#475569", paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
          <li>Each branch defines a GPS center, a radius in meters, and an optional fence time window (Organization → Branches).</li>
          <li>On check-in <b>and</b> check-out the server computes the haversine distance from the branch center and rejects punches outside the radius — with the exact distance in the error.</li>
          <li>Disabled fences, fence time windows and GPS accuracy are validated server-side; every punch stores lat/lng + accuracy for audit.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Punch Simulator */}
        <div className="hrm-card p-5">
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: "0 0 12px" }}>Punch Simulator</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button className={`hrm-pill ${mode === "in" ? "hrm-pill-active" : ""}`} onClick={() => setMode("in")}>Simulate Check-In</button>
            <button className={`hrm-pill ${mode === "out" ? "hrm-pill-active" : ""}`} onClick={() => setMode("out")}>Simulate Check-Out</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Employee</label>
              <select className="hrm-select w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Select employee...</option>
                {toArray(employeesData?.items).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.code})</option>
                ))}
              </select>
              <p style={{ fontSize: 10.5, color: "var(--hrm-muted)", marginTop: 2 }}>The employee's own branch geo-fence is used for validation.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Latitude</label>
                <input className="hrm-select w-full" type="text" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Longitude</label>
                <input className="hrm-select w-full" type="text" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Accuracy (m) <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optional)</span></label>
              <input className="hrm-select w-full" type="number" value={accuracy} onChange={(e) => setAccuracy(e.target.value)} />
            </div>
            <button className="hrm-pill hrm-pill-active w-full justify-center" disabled={simulating || !employeeId}
              onClick={simulate}>
              {simulating ? "Evaluating…" : `Simulate ${mode === "in" ? "Check-In" : "Check-Out"}`}
            </button>
            {result && (
              <div className="rounded-lg p-3" style={{
                background: result.allowed ? "#F0FDF4" : "#FEF2F2",
                border: `1px solid ${result.allowed ? "#BBF7D0" : "#FECACA"}`,
              }}>
                <div className="flex items-center gap-2">
                  {result.distanceMeters == null
                    ? <span className="hrm-chip hrm-chip-probation">No geo-fence</span>
                    : result.allowed
                      ? <span className="hrm-chip hrm-chip-active">◎ Inside radius</span>
                      : <span className="hrm-chip hrm-chip-absent">✕ Outside radius</span>}
                  {result.branchName && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--hrm-text)" }}>{result.branchName}</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#475569", margin: "6px 0 0" }}>{result.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Branch Geo-Fence Configuration */}
        <div className="hrm-card p-5">
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: "0 0 12px" }}>Branch Geo-Fence Configuration</h2>
          <div className="overflow-x-auto">
            <table className="hrm-table">
              <thead><tr>{["Branch", "GPS Center", "Radius", "Geo-Fence", "Fence Window"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {branchList.map((b: any) => (
                  <tr key={b.id}>
                    <td>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "var(--hrm-text)" }}>{b.name}</p>
                      <p style={{ margin: 0, fontSize: 10.5, color: "var(--hrm-muted)" }}>{b.code} · {b.type}</p>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "#475569" }}>
                      {b.latitude != null && b.longitude != null ? `${b.latitude}, ${b.longitude}` : "—"}
                    </td>
                    <td>{b.latitude != null ? "200m" : "—"}</td>
                    <td>{b.latitude != null && b.longitude != null
                      ? <span className="hrm-chip hrm-chip-active">◎ Enabled</span>
                      : <span className="hrm-chip hrm-chip-resigned">Disabled</span>}
                    </td>
                    <td>{b.operatingHours || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 0 0", fontSize: 11.5, color: "var(--hrm-muted)" }}>
            {branchList.length} records
          </div>
        </div>
      </div>
    </div>
  );
}
