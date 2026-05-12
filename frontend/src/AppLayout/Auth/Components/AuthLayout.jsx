const STATS_CARD = (
  <>
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>Active threats</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#111827', letterSpacing: '-0.03em' }}>2,847</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>Severity</div>
          <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, letterSpacing: '0.05em' }}>CRITICAL</div>
        </div>
      </div>
      <div style={{ background: '#F3F4F6', borderRadius: 2, height: 2, width: '100%', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '73%', background: 'linear-gradient(90deg, #EF4444, #F97316)', borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>↑ 14% this week</span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>73 / 100</span>
      </div>
    </div>

    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex' }}>
        {[
          { label: 'Mitigated', val: '1,204', color: '#22C55E' },
          { label: 'Pending',   val: '318',   color: '#F59E0B' },
          { label: 'Analysts',  val: '24',    color: '#6B7280' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', fontWeight: 500, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const FEED = (
  <>
    <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 10, fontWeight: 600 }}>Live feed</div>
    {[
      { color: '#EF4444', text: 'APT-41 lateral movement — US-EAST-1', time: '2 min ago' },
      { color: '#F59E0B', text: 'Suspicious C2 beacon — 185.220.101.42', time: '11 min ago' },
      { color: '#22C55E', text: 'Ransomware variant quarantined — EU-WEST-2', time: '28 min ago' },
    ].map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderTop: i === 0 ? '1px solid #F3F4F6' : '1px solid #E5E7EB' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, marginTop: 3, flexShrink: 0, boxShadow: `0 0 6px ${item.color}60` }} />
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.45 }}>{item.text}</div>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{item.time}</div>
        </div>
      </div>
    ))}
  </>
);

export const REASONS = (
  <>
    <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 10, fontWeight: 600 }}>Why join?</div>
    {[
      'Real-time correlation across 140+ intel sources',
      'Automated MITRE ATT&CK mapping and playbooks',
      'SOC collaboration with shared analyst workspaces',
    ].map((text, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8B5CF6', marginTop: 4, flexShrink: 0, boxShadow: '0 0 6px #8B5CF660' }} />
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.45 }}>{text}</div>
      </div>
    ))}
  </>
);

export const RESET_STEPS = (
  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 14, fontWeight: 500 }}>Reset process</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        'Enter your registered email address',
        'Click the secure link sent to your inbox',
        'Set a new strong password — link expires in 15 min',
      ].map((text, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #22D3EE30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: '#22D3EE', fontWeight: 600 }}>{i + 1}</span>
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{text}</span>
        </div>
      ))}
    </div>
  </div>
);

export const PW_REQUIREMENTS = (
  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 12, fontWeight: 500 }}>Password requirements</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {['Minimum 8 characters', 'At least one uppercase letter', 'At least one number', 'One special character (!@#$…)'].map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#6B7280' }}>{r}</span>
        </div>
      ))}
    </div>
  </div>
);

const AuthLayout = ({ children, leftContent }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#FFFFFF',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      {/* Left panel */}
      <div style={{
        width: '40%',
        minWidth: 320,
        background: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
            Contagion
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7, margin: 0, maxWidth: 200 }}>
            Threat intelligence for modern security teams.
          </p>
        </div>

        {STATS_CARD}
        {leftContent}

        {/* Footer status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 'auto', paddingTop: 24 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E80' }} />
          <span style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            All systems operational
          </span>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: '#F9FAFB',
      }}>
        <div style={{ width: '100%', maxWidth: 310 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
