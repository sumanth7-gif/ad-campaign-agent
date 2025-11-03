"use client";

import { useState } from "react";
import { createPlan, Brief } from "../lib/api-client";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function CampaignSummary({ plan, metrics }: { plan: any; metrics?: any }) {
  const totalBudget = plan.total_budget || 0;
  const breakdown = plan.budget_breakdown || {};
  const adGroups = plan.ad_groups || [];
  const checks = plan.checks || {};
  
  const totalCreatives = adGroups.reduce((sum: number, ag: any) => sum + (ag.creatives?.length || 0), 0);

  return (
    <div style={{ 
      background: '#f9fafb', 
      border: '1px solid #e5e7eb', 
      borderRadius: 8, 
      padding: 24,
      marginBottom: 16
    }}>
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 24 }}>📊 Campaign Summary</h2>
      
      {/* Campaign Overview */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 12, color: '#111827' }}>Campaign Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div>
            <strong style={{ color: '#6b7280' }}>Campaign:</strong>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{plan.campaign_name || plan.campaign_id}</div>
          </div>
          <div>
            <strong style={{ color: '#6b7280' }}>Objective:</strong>
            <div style={{ fontSize: 16, fontWeight: 500 }}>
              {plan.objective?.replace('_', ' ').toUpperCase() || 'N/A'}
            </div>
          </div>
          <div>
            <strong style={{ color: '#6b7280' }}>Total Budget:</strong>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#059669' }}>
              {formatCurrency(totalBudget)}
            </div>
          </div>
          <div>
            <strong style={{ color: '#6b7280' }}>Ad Groups:</strong>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{adGroups.length}</div>
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 12, color: '#111827' }}>Budget Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {Object.entries(breakdown).map(([channel, amount]) => {
            const percentage = totalBudget > 0 ? ((amount as number) / totalBudget * 100).toFixed(1) : 0;
            return (
              <div key={channel} style={{ 
                background: 'white', 
                padding: 12, 
                borderRadius: 6,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>
                  {channel}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#059669' }}>
                  {formatCurrency(amount as number)}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
        {checks.budget_sum_ok === false && (
          <div style={{ marginTop: 8, padding: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 4, fontSize: 14 }}>
            ⚠️ Budget sum mismatch detected
          </div>
        )}
      </div>

      {/* Ad Groups */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 12, color: '#111827' }}>
          Ad Groups ({adGroups.length}) • {totalCreatives} Total Creatives
        </h3>
        {adGroups.map((ag: any, idx: number) => (
          <div 
            key={ag.id || idx} 
            style={{ 
              background: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: 6, 
              padding: 16,
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <strong style={{ fontSize: 16 }}>{ag.id || `Group ${idx + 1}`}</strong>
                {ag.channel && (
                  <span style={{ 
                    marginLeft: 8, 
                    padding: '2px 8px', 
                    background: '#eff6ff', 
                    color: '#2563eb',
                    borderRadius: 4,
                    fontSize: 12,
                    textTransform: 'capitalize'
                  }}>
                    {ag.channel}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                {ag.creatives?.length || 0} creatives
              </div>
            </div>
            
            {ag.target && (
              <div style={{ marginBottom: 12, fontSize: 14, color: '#6b7280' }}>
                <strong>Target:</strong> {typeof ag.target === 'object' 
                  ? Object.entries(ag.target).map(([k, v]) => `${k}: ${v}`).join(', ')
                  : ag.target}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <strong style={{ fontSize: 14, color: '#111827' }}>Creatives:</strong>
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                {ag.creatives?.map((creative: any, cIdx: number) => (
                  <div 
                    key={creative.id || cIdx}
                    style={{ 
                      padding: 12, 
                      background: '#f9fafb', 
                      borderRadius: 4,
                      borderLeft: `3px solid ${creative.relative_score >= 70 ? '#10b981' : creative.relative_score >= 50 ? '#f59e0b' : '#3b82f6'}`
                    }}
                  >
                    {creative.relative_score !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ 
                          padding: '2px 8px', 
                          background: creative.relative_score >= 70 ? '#d1fae5' : creative.relative_score >= 50 ? '#fef3c7' : '#dbeafe',
                          color: creative.relative_score >= 70 ? '#065f46' : creative.relative_score >= 50 ? '#92400e' : '#1e40af',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          Score: {creative.relative_score} / Rank: #{creative.performance_rank}
                        </div>
                      </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Headline:
                      </strong>
                      <div style={{ fontWeight: 600, marginTop: 4, fontSize: 15 }}>
                        {creative.headline}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Body:
                      </strong>
                      <div style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>
                        {creative.body}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <div>
                        <strong style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                          CTA:
                        </strong>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: '#dbeafe', 
                          color: '#1e40af',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {creative.cta}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                        {creative.justification}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Validation Checks */}
      <div style={{ 
        padding: 12, 
        background: checks.budget_sum_ok && checks.required_fields_present && checks.channel_valid !== false
          ? '#f0fdf4' 
          : '#fef2f2',
        border: `1px solid ${checks.budget_sum_ok && checks.required_fields_present && checks.channel_valid !== false ? '#bbf7d0' : '#fecaca'}`,
        borderRadius: 6,
        marginBottom: 16
      }}>
        <strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>Validation Checks:</strong>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14 }}>
            {checks.budget_sum_ok ? '✅' : '❌'} Budget Sum OK
          </div>
          <div style={{ fontSize: 14 }}>
            {checks.required_fields_present ? '✅' : '❌'} Required Fields Present
          </div>
          {checks.channel_valid !== undefined && (
            <div style={{ fontSize: 14 }}>
              {checks.channel_valid ? '✅' : '❌'} Channels Valid
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={{ 
          padding: 16, 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd',
          borderRadius: 6
        }}>
          <h3 style={{ fontSize: 18, marginTop: 0, marginBottom: 16, color: '#111827' }}>📈 Request Metrics</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Tokens</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {metrics.tokens?.total || 0}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {metrics.tokens?.prompt || 0} prompt + {metrics.tokens?.completion || 0} completion
              </div>
            </div>
            <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Latency</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {metrics.latency ? `${metrics.latency}ms` : 'N/A'}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                Request processing time
              </div>
            </div>
          </div>

          {metrics.hallucinationFlags && (
            <div style={{ 
              padding: 12, 
              background: metrics.hallucinationFlags.score === 0 
                ? '#f0fdf4' 
                : metrics.hallucinationFlags.score < 0.5
                ? '#fffbeb'
                : '#fef2f2',
              border: `1px solid ${metrics.hallucinationFlags.score === 0 
                ? '#bbf7d0' 
                : metrics.hallucinationFlags.score < 0.5
                ? '#fde68a'
                : '#fecaca'}`,
              borderRadius: 6
            }}>
              <strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>Hallucination Detection:</strong>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ fontSize: 13 }}>
                  {metrics.hallucinationFlags.productFeaturesInvented ? '⚠️' : '✅'} Features Grounded
                </div>
                <div style={{ fontSize: 13 }}>
                  {metrics.hallucinationFlags.invalidChannels ? '⚠️' : '✅'} Channels Valid
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: metrics.hallucinationFlags.score === 0 ? '#059669' : metrics.hallucinationFlags.score < 0.5 ? '#d97706' : '#dc2626' }}>
                Overall Score: {(metrics.hallucinationFlags.score * 100).toFixed(0)}% 
                {metrics.hallucinationFlags.score === 0 && ' (No issues detected)'}
                {metrics.hallucinationFlags.score > 0 && metrics.hallucinationFlags.score < 0.5 && ' (Minor issues)'}
                {metrics.hallucinationFlags.score >= 0.5 && ' (Issues detected)'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const exampleBrief: Brief = {
  campaign_id: "cmp_2025_09_01",
  goal: "increase trial signups by 20% over next 30 days",
  product: {
    name: "FocusFlow",
    category: "productivity app",
    key_features: ["AI-assisted task prioritization", "calendar integration", "offline mode"],
    price: "free trial (14d) then $9.99/mo"
  },
  budget: 5000,
  channels: ["search", "social"],
  audience_hints: ["young professionals", "remote workers"],
  tone: "confident and concise"
};

export default function Page() {
  const [briefText, setBriefText] = useState(JSON.stringify(exampleBrief, null, 2));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setMetrics(null);
    setLoading(true);
    try {
      const parsed: Brief = JSON.parse(briefText);
      const res = await createPlan(parsed);
      // Handle response with or without metrics
      if (res.plan && res.metrics) {
        setResult(res.plan);
        setMetrics(res.metrics);
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setError(err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1>RadicAI Ad Campaign Agent</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <label>
          Brief JSON
          <textarea
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            rows={16}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 14 }}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Generating…' : 'Generate Plan'}
        </button>
      </form>
      {error && (
        <div style={{ marginTop: 16, color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Campaign Plan</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowSummary(true)}
                style={{
                  padding: '6px 12px',
                  background: showSummary ? '#3b82f6' : '#e5e7eb',
                  color: showSummary ? 'white' : '#111827',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Summary
              </button>
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                style={{
                  padding: '6px 12px',
                  background: !showSummary ? '#3b82f6' : '#e5e7eb',
                  color: !showSummary ? 'white' : '#111827',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                JSON
              </button>
            </div>
          </div>
          
          {showSummary ? (
            <CampaignSummary plan={result} metrics={metrics} />
          ) : (
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              overflow: 'auto',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 13,
              lineHeight: 1.6
            }}>
              {JSON.stringify(metrics ? { plan: result, metrics } : result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

