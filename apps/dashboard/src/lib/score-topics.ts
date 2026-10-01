export interface ScoreTopicDefinition {
  id: string
  matchKey: string
  name: string
  subtitle: string
}

export const SCORE_TOPICS: ScoreTopicDefinition[] = [
  {
    id: "diabetes",
    matchKey: "findrisc",
    name: "Diabetes",
    subtitle: "Metabolic health",
  },
  {
    id: "sleep_apnea",
    matchKey: "stop_bang",
    name: "Sleep Apnea",
    subtitle: "Respiratory & sleep quality",
  },
  {
    id: "depression",
    matchKey: "phq",
    name: "Mood & Well-being",
    subtitle: "Emotional well-being",
  },
  {
    id: "metabolic_syndrome",
    matchKey: "metabolic",
    name: "Metabolic Health",
    subtitle: "Cardiometabolic risk",
  },
  {
    id: "eoss",
    matchKey: "eoss",
    name: "Obesity-related Health Impact",
    subtitle: "Health impact staging",
  },
  {
    id: "cardiovascular",
    matchKey: "score2",
    name: "Cardiovascular Risk",
    subtitle: "Heart health & 10-year CVD risk",
  },
  {
    id: "nordic_nmq",
    matchKey: "nordic",
    name: "Musculoskeletal Risk",
    subtitle: "Ergonomics & physical load",
  },
  {
    id: "audit_c",
    matchKey: "audit",
    name: "Alcohol Risk Assessment",
    subtitle: "Occupational safety & consumption",
  },
  {
    id: "pss10",
    matchKey: "pss",
    name: "Perceived Stress & Burnout",
    subtitle: "Psychological resilience & burnout",
  },
]

export function getTopicMeta(
  scoreId: string = "",
  scoreName: string = ""
): ScoreTopicDefinition {
  const sid = (scoreId || "").toLowerCase()
  const sn = (scoreName || "").toLowerCase()

  for (const topic of SCORE_TOPICS) {
    if (
      sid.includes(topic.id) ||
      sid.includes(topic.matchKey) ||
      sn.includes(topic.name.toLowerCase()) ||
      sn.includes(topic.matchKey) ||
      sn.includes(topic.id)
    ) {
      return topic
    }
  }

  return {
    id: scoreId || scoreName || "unknown",
    matchKey: "unknown",
    name: scoreName || scoreId || "Clinical Evaluation",
    subtitle: "Medical assessment",
  }
}

export function isScoreDeactivated(
  scoreName: string,
  scoreWeights: Record<string, number> | null,
  scoreId: string = ""
): boolean {
  if (!scoreWeights) return false
  const topic = getTopicMeta(scoreId, scoreName)
  return (scoreWeights[topic.id] ?? 0) <= 0
}
