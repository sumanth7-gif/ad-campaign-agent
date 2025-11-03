export interface RequestMetrics {
  campaignId: string;
  timestamp: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  latency: number; // milliseconds
  hallucinationFlags: {
    productFeaturesInvented: boolean;
    invalidChannels: boolean;
    score: number; // 0-1, higher = more hallucination detected
  };
  validationErrors: string[];
}

export function detectHallucinations(brief: any, plan: any): RequestMetrics['hallucinationFlags'] {
  const flags = {
    productFeaturesInvented: false,
    invalidChannels: false,
    score: 0,
  };

  const briefFeatures = (brief.product?.key_features || []).map((f: string) => f.toLowerCase());

  // Check if product features were invented in creatives
  if (plan.ad_groups) {
    for (const group of plan.ad_groups) {
      if (group.creatives) {
        for (const creative of group.creatives) {
          const creativeText = `${creative.headline || ''} ${creative.body || ''}`.toLowerCase();
          
          // Normalize brief features: split into words and create a set of all feature words
          const briefFeatureWords = new Set<string>();
          briefFeatures.forEach((feature: string) => {
            feature.split(/[\s\-_,]+/).forEach(word => {
              if (word.length > 2) briefFeatureWords.add(word); // Skip very short words
            });
            // Also add the full feature phrase
            briefFeatureWords.add(feature);
          });
          
          // Extract feature keywords that are suspicious if not in brief
          const suspiciousKeywords = ['analytics', 'reporting', 'automation', 'ml', 'machine learning', 
                                     'encryption', 'backup', 'collaboration', 'real-time', 'sync'];
          
          // Allow common general descriptors that don't necessarily indicate features
          const allowedKeywords = ['ai', 'cloud', 'secure', 'integration', 'offline', 'api'];
          
          // Check for suspicious keywords that aren't in brief features
          suspiciousKeywords.forEach((keyword) => {
            if (creativeText.includes(keyword)) {
              // Check if this keyword or related words appear in brief features
              const keywordWords = keyword.split(/[\s\-_]+/);
              const matchesBriefFeature = keywordWords.some((kw) => 
                Array.from(briefFeatureWords).some((bfWord) => 
                  bfWord.includes(kw) || kw.includes(bfWord)
                )
              );
              
              if (!matchesBriefFeature) {
                flags.productFeaturesInvented = true;
                flags.score += 0.1; // Reduced penalty
              }
            }
          });
        }
      }
    }
  }

  // Check for invalid channels in budget breakdown
  const allowedChannels = ['search', 'social', 'display'];
  const planChannels = Object.keys(plan.budget_breakdown || {});
  planChannels.forEach((channel) => {
    if (!allowedChannels.includes(channel.toLowerCase())) {
      flags.invalidChannels = true;
      flags.score += 0.1;
    }
  });

  // Normalize score to 0-1
  flags.score = Math.min(1, flags.score);

  return flags;
}

export function logMetrics(metrics: RequestMetrics): void {
  const logEntry = {
    type: 'request_metrics',
    ...metrics,
  };

  // Log summary first
  console.log(`\n=== Request Metrics Summary ===`);
  console.log(`Campaign: ${metrics.campaignId}`);
  console.log(`Tokens: ${metrics.tokens.total} (${metrics.tokens.prompt} prompt + ${metrics.tokens.completion} completion)`);
  console.log(`Latency: ${metrics.latency}ms`);
  console.log(`Hallucination Score: ${(metrics.hallucinationFlags.score * 100).toFixed(1)}%`);
  if (metrics.hallucinationFlags.score > 0) {
    console.log(`  - Features invented: ${metrics.hallucinationFlags.productFeaturesInvented ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`  - Invalid channels: ${metrics.hallucinationFlags.invalidChannels ? 'YES ⚠️' : 'NO ✓'}`);
  }
  if (metrics.validationErrors.length > 0) {
    console.log(`Validation Errors: ${metrics.validationErrors.join(', ')}`);
  }
  console.log(`==============================\n`);

  // Log full JSON (in production, this would go to a logging service)
  console.log(JSON.stringify(logEntry, null, 2));
}

