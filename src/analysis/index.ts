import { Signal } from '../discovery';
import { CloudflareAILLMProvider } from '../llm';

export interface Cluster {
  id: string;
  theme: string;
  signals: Signal[];
  significance_score: number;
}

export interface AnalysisResult {
  contrarianAngle: string;
  incentiveInsight: string;
  systemLoop: string;
  synthesis: string;
  qualityScore: number;
}

export async function clusterSignals(signals: Signal[], llm: CloudflareAILLMProvider): Promise<Cluster | null> {
  if (signals.length === 0) return null;
  
  llm.setPurpose('clustering');
  
  const prompt = `You are a strategic intelligence analyst. Group these raw signals by underlying theme or trend. Identify which cluster represents the most significant convergence of information (where multiple disparate sources point to the same structural shift).
  
Signals:
${signals.map((s, i) => `[${i+1}] ${s.source.toUpperCase()}: ${s.title}\n${s.summary}`).join('\n\n')}

Identify the single most important cluster. Return a JSON object with:
- "theme": A short, sharp description of the underlying trend.
- "signal_indices": Array of integers (1-indexed) of the signals that belong to this cluster.
- "significance_score": A float between 0.0 and 1.0 indicating how important this convergence is.
`;

  const schema = {
    theme: "string",
    signal_indices: ["number"],
    significance_score: "number"
  };

  const result = await llm.generateStructured<{ theme: string, signal_indices: number[], significance_score: number }>(prompt, schema);
  
  if (!result || !result.signal_indices || result.signal_indices.length === 0) {
    // Fallback: just pick the top 3
    return {
      id: crypto.randomUUID(),
      theme: "General Tech Developments",
      signals: signals.slice(0, 3),
      significance_score: 0.5
    };
  }

  const clusteredSignals = result.signal_indices
    .map(i => signals[i - 1])
    .filter(s => s !== undefined);

  if (clusteredSignals.length === 0) return null;

  return {
    id: crypto.randomUUID(),
    theme: result.theme,
    signals: clusteredSignals,
    significance_score: result.significance_score || 0.5
  };
}

export async function analyzeCluster(cluster: Cluster, llm: CloudflareAILLMProvider): Promise<AnalysisResult | null> {
  const context = `Theme: ${cluster.theme}\n\nSignals:\n${cluster.signals.map(s => `- ${s.title}\n  ${s.summary}`).join('\n')}`;

  // 1. Contrarian Analysis
  llm.setPurpose('contrarian');
  const contrarianPrompt = `Context: ${context}\n\nWhat is the popular, mainstream narrative around this topic, and what specific data point, statistic, or historical precedent contradicts it? Provide a sharp, one-paragraph contrarian angle.`;
  const contrarianAngle = await llm.generate(contrarianPrompt);

  // 2. Incentive Analysis
  llm.setPurpose('incentive');
  const incentivePrompt = `Context: ${context}\nContrarian Angle: ${contrarianAngle}\n\nWho actually benefits from the current arrangement or the popular narrative? Expose the hidden incentive structure that explains the real motivation behind this trend. Follow the money, power, or structural advantage. Provide a sharp, one-paragraph insight.`;
  const incentiveInsight = await llm.generate(incentivePrompt);

  // 3. Systems Analysis
  llm.setPurpose('systems');
  const systemsPrompt = `Context: ${context}\nIncentive: ${incentiveInsight}\n\nWhat feedback loop, emergent behavior, or unintended consequence locks this system into its current state? Show the causal chain. Provide a sharp, one-paragraph systems breakdown.`;
  const systemLoop = await llm.generate(systemsPrompt);

  // 4. Synthesis
  llm.setPurpose('synthesis');
  const synthesisPrompt = `You are "Suyash Dwivedi", an intellectual tech operator who exposes hidden business systems, funding strategies, and technical incentives in the modern tech landscape. 
Based on this analysis:
- Contrarian Angle: ${contrarianAngle}
- Incentive: ${incentiveInsight}
- System Loop: ${systemLoop}

Synthesize this into a single, devastatingly sharp core thesis. It should sound like a revelation. Do not use corporate speak, emojis, or hashtags.`;
  const synthesis = await llm.generate(synthesisPrompt);

  // 5. Quality Gate
  llm.setPurpose('critique');
  const critiquePrompt = `Evaluate this thesis: "${synthesis}"
  
Is this insight genuinely non-obvious, or would anyone reading the news arrive at the same conclusion? Does it expose a real incentive or system?
Return a JSON object with:
- "is_non_obvious": boolean
- "exposes_system": boolean
- "quality_score": float (0.0 to 1.0)
`;
  const critiqueSchema = { is_non_obvious: "boolean", exposes_system: "boolean", quality_score: "number" };
  const critique = await llm.generateStructured<{ is_non_obvious: boolean, exposes_system: boolean, quality_score: number }>(critiquePrompt, critiqueSchema);

  return {
    contrarianAngle,
    incentiveInsight,
    systemLoop,
    synthesis,
    qualityScore: critique ? critique.quality_score : 0.5
  };
}
