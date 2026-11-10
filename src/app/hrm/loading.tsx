// src/app/hrm/loading.tsx — shell-level loading state for lazy sections.
export default function HrmLoading() {
  return (
    <div>
      <div className="hrm-loading-block" style={{ width: 220, height: 22 }} />
      <div className="hrm-loading-block" style={{ width: 340, marginTop: 10 }} />
      <div className="hrm-card" style={{ height: 220, marginTop: 24 }} />
    </div>
  );
}
