import fs from "node:fs";
import path from "node:path";
import type { Brief } from "./schemas";

interface ProductFact {
  product_id: string;
  product_name: string;
  verified_features: string[];
  official_price: string;
  trial_length: string | null;
  official_description: string;
  target_audience: string[];
  key_benefits: string[];
}

interface ProductMatch {
  product: ProductFact;
  score: number;
  matchType: 'exact' | 'tfidf' | 'partial' | 'category';
}

interface AdMetric {
  campaign_id: string;
  product_category: string;
  channel: string;
  headline_type: string;
  headline_keywords: string[];
  ctr: number;
  conversion_rate: number;
  avg_cost_per_conversion: number;
}

interface KnowledgeBase {
  products: ProductFact[];
  ad_metrics: AdMetric[];
}

let cachedKB: KnowledgeBase | null = null;

function loadKnowledgeBase(): KnowledgeBase {
  if (cachedKB) return cachedKB;
  
  const kbPath = path.join(process.cwd(), "src", "lib", "knowledge-base.json");
  const content = fs.readFileSync(kbPath, "utf8");
  cachedKB = JSON.parse(content);
  return cachedKB!;
}

/**
 * Tokenize text into words (lowercase, alphanumeric only)
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Skip very short words
}

/**
 * Calculate TF-IDF similarity between query and document
 * Simplified TF-IDF: term frequency × inverse document frequency
 */
function calculateTFIDFSimilarity(query: string, document: string, corpus: string[]): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(document);
  
  if (queryTokens.length === 0 || docTokens.length === 0) return 0;
  
  // Calculate term frequencies in document
  const docTF = new Map<string, number>();
  docTokens.forEach(token => {
    docTF.set(token, (docTF.get(token) || 0) + 1);
  });
  
  // Calculate IDF for query terms
  const corpusSize = corpus.length;
  const termScores: number[] = [];
  
  queryTokens.forEach(queryTerm => {
    // TF: how many times term appears in doc
    const tf = docTF.get(queryTerm) || 0;
    
    if (tf > 0) {
      // IDF: how rare is the term across all docs
      const docsWithTerm = corpus.filter(doc => 
        tokenize(doc).includes(queryTerm)
      ).length;
      
      const idf = Math.log((corpusSize + 1) / (docsWithTerm + 1));
      
      // TF-IDF score for this term
      termScores.push(tf * idf);
    }
  });
  
  // Average score across query terms (normalized by query length)
  const score = termScores.length > 0 
    ? termScores.reduce((sum, s) => sum + s, 0) / queryTokens.length
    : 0;
  
  return score;
}

/**
 * Calculate cosine similarity between two text strings
 * Simple approach: Jaccard similarity of word sets
 */
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Find matching product facts from knowledge base using similarity scoring
 */
export function retrieveProductFacts(brief: Brief): ProductFact | null {
  const kb = loadKnowledgeBase();
  const productName = brief.product.name.toLowerCase().trim();
  const category = brief.product.category.toLowerCase();
  const features = brief.product.key_features.join(" ").toLowerCase();
  
  // Build query from brief
  const query = `${productName} ${category} ${features}`;
  
  // Try exact match first (highest priority)
  const exactMatch = kb.products.find(
    p => p.product_name.toLowerCase() === productName
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Build corpus for IDF calculation
  const corpus = kb.products.map(p => 
    `${p.product_name} ${p.product_id} ${p.official_description} ${p.verified_features.join(" ")}`
  );
  
  // Calculate similarity scores for all products
  const matches: ProductMatch[] = kb.products.map(product => {
    const productText = `${product.product_name} ${product.product_id} ${product.official_description} ${product.verified_features.join(" ")}`;
    
    // TF-IDF score
    const tfidfScore = calculateTFIDFSimilarity(query, productText, corpus);
    
    // Jaccard similarity as additional signal
    const jaccardScore = calculateJaccardSimilarity(query, productText);
    
    // Combined score (weighted)
    const combinedScore = (tfidfScore * 0.7) + (jaccardScore * 0.3);
    
    // Boost for partial name match
    let finalScore = combinedScore;
    if (productName.includes(product.product_name.toLowerCase()) ||
        product.product_name.toLowerCase().includes(productName)) {
      finalScore += 0.5; // Significant boost for name match
    }
    
    // Boost for category match
    if (category.includes(product.product_id.split("_")[0]) || 
        product.product_id.includes(category.split(" ")[0])) {
      finalScore += 0.2;
    }
    
    return {
      product,
      score: finalScore,
      matchType: 'tfidf' as const
    };
  });
  
  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  
  // Return best match if score is above threshold
  const bestMatch = matches[0];
  const SIMILARITY_THRESHOLD = 0.1; // Low threshold since KB is small
  
  if (bestMatch && bestMatch.score > SIMILARITY_THRESHOLD) {
    console.log(`[Retrieval] Best match: ${bestMatch.product.product_name} (score: ${bestMatch.score.toFixed(3)})`);
    return bestMatch.product;
  }
  
  return null;
}

/**
 * Find relevant ad metrics based on campaign brief
 */
export function retrieveAdMetrics(brief: Brief, channels: string[]): AdMetric[] {
  const kb = loadKnowledgeBase();
  const category = brief.product.category.toLowerCase();
  
  const relevant = kb.ad_metrics.filter(metric => {
    const categoryMatch = metric.product_category.toLowerCase() === category ||
                         category.includes(metric.product_category.toLowerCase());
    const channelMatch = channels.length === 0 || 
                        channels.some(c => c.toLowerCase() === metric.channel);
    return categoryMatch && channelMatch;
  });
  
  // Sort by performance (CTR * conversion_rate)
  return relevant.sort((a, b) => {
    const scoreA = a.ctr * a.conversion_rate;
    const scoreB = b.ctr * b.conversion_rate;
    return scoreB - scoreA; // Descending
  });
}

/**
 * Format retrieved facts for inclusion in prompt
 */
export function formatRetrievedContext(brief: Brief): string {
  const productFact = retrieveProductFacts(brief);
  const channels = Array.isArray(brief.channels) ? brief.channels : [brief.channels].filter(Boolean);
  const metrics = retrieveAdMetrics(brief, channels);
  
  const parts: string[] = [];
  
  if (productFact) {
    parts.push("VERIFIED PRODUCT FACTS:");
    parts.push(`- Product: ${productFact.product_name}`);
    parts.push(`- Verified Features: ${productFact.verified_features.join(", ")}`);
    parts.push(`- Official Price: ${productFact.official_price}`);
    if (productFact.trial_length) {
      parts.push(`- Trial: ${productFact.trial_length}`);
    }
    parts.push(`- Description: ${productFact.official_description}`);
    if (productFact.key_benefits.length > 0) {
      parts.push(`- Key Benefits: ${productFact.key_benefits.join(", ")}`);
    }
  }
  
  if (metrics.length > 0) {
    parts.push("\nHISTORICAL AD PERFORMANCE:");
    const topMetrics = metrics.slice(0, 3); // Top 3
    topMetrics.forEach(metric => {
      parts.push(`- Channel: ${metric.channel} | Headline Type: ${metric.headline_type}`);
      parts.push(`  CTR: ${(metric.ctr * 100).toFixed(2)}% | Conversion: ${(metric.conversion_rate * 100).toFixed(2)}%`);
      parts.push(`  Effective Keywords: ${metric.headline_keywords.join(", ")}`);
    });
  }
  
  return parts.join("\n");
}

/**
 * Validate generated plan against retrieved facts
 */
export function validateAgainstKB(brief: Brief, plan: any): string[] {
  const errors: string[] = [];
  const productFact = retrieveProductFacts(brief);
  
  if (!productFact) return errors; // No KB entry, skip validation
  
  // Check features mentioned in plan match KB
  if (plan.ad_groups) {
    for (const group of plan.ad_groups || []) {
      for (const creative of group.creatives || []) {
        const text = `${creative.headline} ${creative.body}`.toLowerCase();
        const mentionedFeatures: string[] = [];
        
        productFact.verified_features.forEach(feature => {
          if (text.includes(feature.toLowerCase())) {
            mentionedFeatures.push(feature);
          }
        });
        
        // This is informational - we'll log but not error
        // In future, could flag if creative mentions features NOT in KB
      }
    }
  }
  
  // Check price matches
  if (plan.ad_groups) {
    const planText = JSON.stringify(plan).toLowerCase();
    const kbPrice = productFact.official_price.toLowerCase();
    
    // Extract numeric price from KB
    const kbPriceMatch = kbPrice.match(/\$?(\d+\.?\d*)/);
    if (kbPriceMatch) {
      const kbPriceNum = parseFloat(kbPriceMatch[1]);
      const planPriceMatches = Array.from(planText.matchAll(/\$?\s*(\d+\.?\d{0,2})\s*(?:per|\/|month|mo)/gi)) as RegExpMatchArray[];
      
      const hasMatchingPrice = planPriceMatches.some((m: RegExpMatchArray) => {
        const planPrice = parseFloat(m[1]);
        return Math.abs(planPrice - kbPriceNum) < 0.11;
      });
      
      if (!hasMatchingPrice && planPriceMatches.length > 0) {
        errors.push(`Price in plan (${planPriceMatches.map((m: RegExpMatchArray) => m[0]).join(", ")}) doesn't match KB price (${productFact.official_price})`);
      }
    }
  }
  
  return errors;
}

