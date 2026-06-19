import React, { useState, useEffect, useRef } from 'react';

interface CountdownFormData {
  countdownTitle?:           string;
  countdownBackgroundColor?: string;
  countdownEndDate?:         string;
  timerPosition?:            string;
  showDays?:                 boolean;
  showHours?:                boolean;
  showMinutes?:              boolean;
  showSeconds?:              boolean;
  showProductPrice?:         boolean;
  showProductRating?:        boolean;
  showAddToCart?:            boolean;
}

interface CountdownProductsProps {
  isActive?:   boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?:     (e: React.DragEvent) => void;
  onMoveUp?:   () => void;
  onMoveDown?: () => void;
  onCopy?:     () => void;
  onDelete?:   () => void;
  viewMode?:   'mobile' | 'desktop';
  // ← new: live form data passed from PreviewArea
  formData?:   CountdownFormData;
}

// ── Countdown logic ───────────────────────────────────────────────────────────

function useCountdown(endDate?: string) {
  const calc = () => {
    if (!endDate) return { d: 0, h: 0, m: 0, s: 0 };
    const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };

  const [time, setTime] = useState(calc);
  const ref = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setTime(calc());
    ref.current = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(ref.current);
  }, [endDate]);  // restarts when endDate changes

  return time;
}

// ── Timer unit block ──────────────────────────────────────────────────────────

const TimeUnit = ({
  value,
  label,
  bgColor,
  mobile,
}: {
  value: number;
  label: string;
  bgColor: string;
  mobile: boolean;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
    <div
      style={{
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        borderRadius: 6,
        padding: mobile ? '4px 7px' : '10px 18px',
        fontSize: mobile ? 13 : 32,
        fontWeight: 700,
        minWidth: mobile ? 28 : 64,
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {String(value).padStart(2, '0')}
    </div>
    {!mobile && (
      <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </span>
    )}
  </div>
);

// ── Separator ─────────────────────────────────────────────────────────────────

const Sep = ({ mobile }: { mobile: boolean }) => (
  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: mobile ? 14 : 28, fontWeight: 700, alignSelf: 'flex-start', marginTop: mobile ? 4 : 10 }}>:</span>
);

// ── Main export ───────────────────────────────────────────────────────────────

export const CountdownProducts = ({
  isActive   = false,
  onDragOver,
  onDrop,
  viewMode   = 'desktop',
  formData   = {},
}: CountdownProductsProps) => {
  const mobile = viewMode === 'mobile';

  // Live values — fall back to sensible defaults so the preview always looks good
  const title   = formData.countdownTitle           ?? 'Flash Sale';
  const bgColor = formData.countdownBackgroundColor ?? '#0d9488';
  const showD   = formData.showDays    !== false;
  const showH   = formData.showHours   !== false;
  const showM   = formData.showMinutes !== false;
  const showS   = formData.showSeconds !== false;
  const showPrice  = formData.showProductPrice  !== false;
  const showRating = formData.showProductRating !== false;
  const showCart   = formData.showAddToCart     !== false;

  // Live countdown from the configured end date (or static fallback)
  const { d, h, m, s } = useCountdown(formData.countdownEndDate ?? undefined);

  // Use static fallback when no date is set yet so the preview isn't all zeros
  const dd = formData.countdownEndDate ? d  : 1;
  const hh = formData.countdownEndDate ? h  : 22;
  const mm = formData.countdownEndDate ? m  : 13;
  const ss = formData.countdownEndDate ? s  : 45;

  // ── Header section (shared between mobile + desktop) ─────────────────────

  const renderHeader = () => (
    <div
      style={{
        background: bgColor,
        borderRadius: mobile ? 10 : 14,
        padding: mobile ? '12px 14px' : '28px 32px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.25s ease',  // smooth color change on picker drag
      }}
    >
      {/* decorative blobs — desktop only */}
      {!mobile && (
        <>
          <div style={{ position:'absolute', top:-60, right:-60, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-50, left:-50, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
        </>
      )}

      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        {/* left: title */}
        <div>
          {!mobile && (
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:99, padding:'2px 12px', fontSize:11, fontWeight:700, color:'#fff', border:'1px solid rgba(255,255,255,0.3)' }}>
                ⚡ FLASH SALE
              </span>
              <span style={{ background:'#ef4444', borderRadius:99, padding:'2px 10px', fontSize:10, fontWeight:700, color:'#fff' }}>
                LIVE NOW
              </span>
            </div>
          )}
          <h3 style={{ color:'#fff', fontWeight:800, fontSize: mobile ? 15 : 30, margin:0, lineHeight:1.1 }}>
            {title}
          </h3>
          {!mobile && (
            <p style={{ color:'rgba(255,255,255,0.8)', fontSize:13, marginTop:6, marginBottom:0 }}>
              Grab your favorites before they're gone!
            </p>
          )}
        </div>

        {/* right: timer */}
        <div>
          {!mobile && (
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.75)', letterSpacing:1, textTransform:'uppercase', marginBottom:10, textAlign:'right' }}>
              ⏰ Hurry! Offer ends in
            </div>
          )}
          {mobile && (
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginRight:6 }}>Ending in</span>
          )}
          <div style={{ display:'flex', alignItems:'flex-start', gap: mobile ? 4 : 8 }}>
            {showD && <><TimeUnit value={dd} label="Days"    bgColor={bgColor} mobile={mobile} /><Sep mobile={mobile} /></>}
            {showH && <><TimeUnit value={hh} label="Hours"   bgColor={bgColor} mobile={mobile} />{(showM || showS) && <Sep mobile={mobile} />}</>}
            {showM && <><TimeUnit value={mm} label="Mins"    bgColor={bgColor} mobile={mobile} />{showS && <Sep mobile={mobile} />}</>}
            {showS &&   <TimeUnit value={ss} label="Secs"    bgColor={bgColor} mobile={mobile} />}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Product card ──────────────────────────────────────────────────────────

  const renderProductCard = (item: number) => (
    <div
      key={item}
      style={{
        background:'#fff',
        borderRadius: mobile ? 10 : 12,
        border:'1px solid #f0f0f0',
        padding: mobile ? '10px' : '12px',
        display:'flex',
        flexDirection: mobile ? 'row' : 'column',
        gap: mobile ? 10 : 0,
        minWidth: mobile ? 260 : undefined,
        cursor:'pointer',
        transition:'box-shadow 0.2s',
      }}
    >
      {/* image placeholder */}
      <div style={{
        background:'#f0fdf8',
        borderRadius: mobile ? 8 : 10,
        border:'1px solid #ccf0e8',
        display:'flex', alignItems:'center', justifyContent:'center',
        width: mobile ? 88 : '100%',
        height: mobile ? 88 : undefined,
        aspectRatio: mobile ? undefined : '1/1',
        flexShrink: 0,
        position:'relative',
        marginBottom: mobile ? 0 : 10,
      }}>
        <svg width="36" height="36" viewBox="0 0 20 20" fill="#5DCAA5">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
        </svg>
        {!mobile && (
          <div style={{ position:'absolute', top:6, right:6, background: bgColor, color:'#fff', borderRadius:6, padding:'2px 7px', fontSize:10, fontWeight:700 }}>
            -56%
          </div>
        )}
      </div>

      {/* info */}
      <div style={{ flex:1 }}>
        <div style={{ fontSize: mobile ? 12 : 13, fontWeight:600, color:'#1f2937', marginBottom:4, lineHeight:1.3 }}>
          Premium Party Gown {item}
        </div>

        {showRating && !mobile && (
          <div style={{ fontSize:12, color:'#f59e0b', marginBottom:6 }}>
            ★★★★★ <span style={{ color:'#9ca3af', fontWeight:400 }}>(128)</span>
          </div>
        )}

        {showPrice && (
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize: mobile ? 15 : 17, fontWeight:700, color:'#dc2626' }}>৳344</span>
            <span style={{ fontSize:11, color:'#9ca3af', textDecoration:'line-through' }}>৳688</span>
          </div>
        )}

        {showCart && (
          <button
            style={{
              marginTop: mobile ? 8 : 10,
              background: bgColor,
              color:'#fff',
              border:'none',
              borderRadius:8,
              padding: mobile ? '5px 12px' : '7px 16px',
              fontSize: mobile ? 12 : 13,
              fontWeight:600,
              cursor:'pointer',
              transition:'opacity 0.15s',
              width: mobile ? undefined : '100%',
            }}
          >
            {mobile ? 'Buy Now' : 'Add to cart'}
          </button>
        )}
      </div>
    </div>
  );

  // ── Mobile layout ─────────────────────────────────────────────────────────

  if (mobile) {
    return (
      <div
        style={{ background:'#f3f4f6', borderRadius:12, padding:12 }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {renderHeader()}
        <div
          style={{ display:'flex', gap:10, marginTop:12, overflowX:'auto', paddingBottom:4 }}
        >
          {[1, 2, 3].map(renderProductCard)}
        </div>
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────

  return (
    <div
      style={{ background:'linear-gradient(to bottom right, #f9fafb, #fff)', borderRadius:16, padding:24 }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {renderHeader()}

      <div
        style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:16 }}
      >
        {[1, 2, 3, 4].map(renderProductCard)}
      </div>

      {/* view all */}
      <div style={{ textAlign:'center', marginTop:20 }}>
        <button
          style={{
            background:'#fff', border:`2px solid ${bgColor}`, color: bgColor,
            borderRadius:10, padding:'10px 32px', fontSize:14, fontWeight:700,
            cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
            transition:'all 0.2s',
          }}
        >
          View all deals
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </button>
        <p style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>Discover more amazing deals before they expire!</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', padding:32 }}>
      <CountdownProducts viewMode="desktop" />
    </div>
  );
}