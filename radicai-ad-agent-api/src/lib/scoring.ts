/**
 * Creative Performance Scoring Heuristic
 * 
 * A simple rule-based model that ranks creatives by expected relative performance.
 * Uses historical ad metrics and creative best practices to assign scores.
 */

import type { Brief, Plan } from "./schemas";
import { retrieveAdMetrics } from "./retrieval";

export interface CreativeScore {
  creativeId: string;
  score: number; // 0-100, higher = better expected performance
  factors: {
    keywordMatch: number;
    headlineTypeMatch: number;
    bestPractices: number;
    channelPerformance: number;
  };
  rank: number; // 1 = best, 2 = second best, etc.
}

/**
 * Score a single creative based on multiple factors
 */
function scoreCreative(
  creative: { headline: string; body: string; cta: string },
  channel: string | undefined,
  category: string,
  historicalMetrics: Array<{
    channel: string;
    headline_type: string;
    headline_keywords: string[];
    ctr: number;
    conversion_rate: number;
  }>
): CreativeScore['factors'] {
  const headline = creative.headline.toLowerCase();
  const body = creative.body.toLowerCase();
  const fullText = `${headline} ${body}`.toLowerCase();
  
  // Factor 1: Keyword matching with successful headlines (0-40 points)
  let keywordMatch = 0;
  const channelMetrics = historicalMetrics.filter(m => 
    !channel || m.channel.toLowerCase() === channel.toLowerCase()
  );
  
  if (channelMetrics.length > 0) {
    // Find best performing metric to use as reference
    const bestMetric = channelMetrics.reduce((best, current) => {
      const bestScore = best.ctr * best.conversion_rate;
      const currentScore = current.ctr * current.conversion_rate;
      return currentScore > bestScore ? current : best;
    });
    
    // Check how many successful keywords appear in this creative
    const matchingKeywords = bestMetric.headline_keywords.filter(keyword =>
      fullText.includes(keyword.toLowerCase())
    );
    
    // Score based on keyword overlap (0-40 points)
    if (bestMetric.headline_keywords.length > 0) {
      keywordMatch = (matchingKeywords.length / bestMetric.headline_keywords.length) * 40;
    }
  }
  
  // Factor 2: Headline type matching (0-20 points)
  let headlineTypeMatch = 0;
  const headlineTypes = [
    { type: 'trial-focused', keywords: ['trial', 'try', 'free', 'start', 'begin'] },
    { type: 'feature-focused', keywords: ['ai', 'automation', 'smart', 'integrat', 'sync'] },
    { type: 'benefit-focused', keywords: ['productivity', 'efficiency', 'time', 'save', 'boost'] },
    { type: 'sustainability-focused', keywords: ['eco', 'sustainable', 'green', 'environment'] },
  ];
  
  for (const typeDef of headlineTypes) {
    const matches = typeDef.keywords.filter(kw => headline.includes(kw));
    if (matches.length > 0) {
      // Check if this type has good historical performance
      const typeMetrics = channelMetrics.filter(m => 
        m.headline_type.toLowerCase().includes(typeDef.type.toLowerCase())
      );
      if (typeMetrics.length > 0) {
        const avgPerformance = typeMetrics.reduce((sum, m) => sum + (m.ctr * m.conversion_rate), 0) / typeMetrics.length;
        headlineTypeMatch = Math.min(20, matches.length * 5 + avgPerformance * 10);
        break; // Use first matching type
      }
    }
  }
  
  // Factor 3: Best practices heuristics (0-25 points)
  let bestPractices = 0;
  
  // Action verbs (0-5 points)
  const actionVerbs = ['get', 'try', 'start', 'discover', 'join', 'claim', 'save', 'boost'];
  const hasActionVerb = actionVerbs.some(verb => headline.includes(verb));
  if (hasActionVerb) bestPractices += 5;
  
  // Numbers/urgency (0-5 points)
  const hasNumber = /\d+/.test(headline);
  const urgencyWords = ['now', 'today', 'limited', 'new', 'free'];
  const hasUrgency = urgencyWords.some(word => fullText.includes(word));
  if (hasNumber || hasUrgency) bestPractices += 5;
  
  // CTA quality (0-5 points)
  const goodCTAs = ['start', 'try', 'get', 'claim', 'sign up', 'download'];
  const ctaLower = creative.cta.toLowerCase();
  const hasGoodCTA = goodCTAs.some(good => ctaLower.includes(good));
  if (hasGoodCTA) bestPractices += 5;
  
  // Appropriate length (0-5 points)
  // Headlines: 30-60 chars are ideal, body: 80-200 chars
  const headlineLen = creative.headline.length;
  const bodyLen = creative.body.length;
  if (headlineLen >= 20 && headlineLen <= 60) bestPractices += 3;
  if (bodyLen >= 50 && bodyLen <= 200) bestPractices += 2;
  
  // Clear value proposition (0-5 points)
  const valueWords = ['free', 'save', 'boost', 'improve', 'better', 'faster', 'easier'];
  const hasValueProp = valueWords.some(word => fullText.includes(word));
  if (hasValueProp) bestPractices += 5;
  
  // Factor 4: Channel-specific performance baseline (0-15 points)
  let channelPerformance = 5; // Default baseline
  if (channel) {
    const channelMetrics = historicalMetrics.filter(m => 
      m.channel.toLowerCase() === channel.toLowerCase()
    );
    if (channelMetrics.length > 0) {
      // Average performance for this channel
      const avgCTR = channelMetrics.reduce((sum, m) => sum + m.ctr, 0) / channelMetrics.length;
      const avgConv = channelMetrics.reduce((sum, m) => sum + m.conversion_rate, 0) / channelMetrics.length;
      const avgScore = avgCTR * avgConv;
      
      // Normalize to 0-15 points (assuming max score of ~0.005 = 15 points)
      channelPerformance = Math.min(15, avgScore * 3000);
    }
  }
  
  return {
    keywordMatch: Math.round(keywordMatch * 100) / 100,
    headlineTypeMatch: Math.round(headlineTypeMatch * 100) / 100,
    bestPractices: Math.round(bestPractices * 100) / 100,
    channelPerformance: Math.round(channelPerformance * 100) / 100,
  };
}

/**
 * Score and rank all creatives in a plan
 */
export function scoreCreatives(plan: Plan, brief: Brief): CreativeScore[] {
  const channels = Array.isArray(brief.channels) ? brief.channels : [brief.channels].filter(Boolean);
  const historicalMetrics = retrieveAdMetrics(brief, channels);
  
  const scores: CreativeScore[] = [];
  
  // Score each creative
  for (const adGroup of plan.ad_groups || []) {
    for (const creative of adGroup.creatives || []) {
      const factors = scoreCreative(
        creative,
        adGroup.channel,
        brief.product.category,
        historicalMetrics.map(m => ({
          channel: m.channel,
          headline_type: m.headline_type,
          headline_keywords: m.headline_keywords,
          ctr: m.ctr,
          conversion_rate: m.conversion_rate,
        }))
      );
      
      const totalScore = 
        factors.keywordMatch +
        factors.headlineTypeMatch +
        factors.bestPractices +
        factors.channelPerformance;
      
      scores.push({
        creativeId: creative.id || 'unknown',
        score: Math.round(Math.min(100, Math.max(0, totalScore)) * 100) / 100,
        factors,
        rank: 0, // Will be set after sorting
      });
    }
  }
  
  // Sort by score descending and assign ranks
  scores.sort((a, b) => b.score - a.score);
  scores.forEach((score, idx) => {
    score.rank = idx + 1;
  });
  
  return scores;
}

/**
 * Add scores to plan creatives (mutates the plan)
 */
export function addScoresToPlan(plan: Plan, brief: Brief): void {
  const scores = scoreCreatives(plan, brief);
  const scoreMap = new Map(scores.map(s => [s.creativeId, s]));
  
  for (const adGroup of plan.ad_groups || []) {
    for (const creative of adGroup.creatives || []) {
      const creativeScore = scoreMap.get(creative.id || 'unknown');
      if (creativeScore) {
        // Add score to creative object (using type assertion since schema doesn't include it)
        (creative as any).relative_score = creativeScore.score;
        (creative as any).performance_rank = creativeScore.rank;
        (creative as any).score_factors = creativeScore.factors;
      }
    }
  }
}

