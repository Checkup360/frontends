export interface LegalDocInfo {
  title: string
  subtitle: string
  version: string
  summary: string
  purpose: string
  dataCollected: string[]
  rights: string[]
  isHealthSensitive?: boolean
  crisisNotice?: boolean
}

export const LEGAL_DOCUMENTS: Record<string, LegalDocInfo> = {
  TERMS_AND_CONDITIONS: {
    title: "Terms and Conditions",
    subtitle: "Checkup360 Platform Terms of Service",
    version: "1.0",
    summary:
      "These terms govern your access and use of the Checkup360 occupational health screening platform. By using the platform, you agree to these conditions.",
    purpose:
      "To provide occupational health screening, wellness analytics, and workplace health management.",
    dataCollected: [
      "Account credentials & contact info",
      "Organization and department association",
      "Platform usage & security activity logs",
    ],
    rights: [
      "Right to access platform features according to your assigned role",
      "Right to terminate account and discontinue use at any time",
    ],
  },
  PRIVACY_POLICY: {
    title: "Privacy Policy",
    subtitle: "How we collect, store, and protect your personal data",
    version: "1.0",
    summary:
      "Checkup360 is committed to safeguarding personal and sensitive data in compliance with personal data protection standards and occupational health privacy guidelines.",
    purpose:
      "To inform you about data processing activities, access permissions, storage duration, security measures, and your privacy rights.",
    dataCollected: [
      "Identification & demographic information",
      "Health metrics, anthropometric values & assessment questionnaire responses",
      "Technical telemetry and security logs",
    ],
    rights: [
      "Your health profile, assessment answers, and risk scores are accessible to authorized organization administrators and occupational health medical professionals for workplace health surveillance and preventive management",
      "Right of access, rectification, update, and data portability (export)",
      "Right to withdraw consent at any time from your account settings",
      "Data is stored securely with encryption in transit and at rest, and accessed under role-based authorization controls",
    ],
  },
  HEALTH_DATA_PROCESSING_CONSENT: {
    title: "Health Data Processing Consent",
    subtitle: "General Informed Consent for Occupational Health & Wellness Screening",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Sensitive health data requires your explicit, informed consent. This consent authorizes Checkup360, your organization administrators, and authorized medical staff to process and review your health measurements and survey responses for preventative occupational health management.",
    purpose:
      "To calculate preventative health and wellness indicators, evaluate occupational risks, and provide actionable health insights to you and your organization's authorized administrators and medical team.",
    dataCollected: [
      "Anthropometric measurements and biological indicators",
      "Lifestyle, habits, and health questionnaires",
      "Occupational wellness survey responses",
    ],
    rights: [
      "Explicit consent is voluntary and enables occupational health evaluations within your organization",
      "Health metrics, assessment responses, and risk indicators are visible to authorized organization administrators and occupational health medical personnel for preventative care and workplace safety",
      "You may revoke this consent or export your data at any time from your account settings",
    ],
  },
  "FORM:biometrics": {
    title: "Physical Biometrics Informed Consent",
    subtitle: "Collection & Analysis of Anthropometric Indicators",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes the collection, evaluation, and review of height, weight, neck circumference, waist circumference, and biological sex by authorized organization administrators and medical personnel.",
    purpose:
      "To determine body composition parameters, weight-to-height indicators, and cardiometabolic wellness insights for occupational health surveillance.",
    dataCollected: [
      "Biological sex",
      "Height & weight (BMI)",
      "Neck and waist circumferences",
    ],
    rights: [
      "Data and indicators are accessible to authorized organization administrators and medical staff for occupational health tracking",
      "You can update your biometrics at any time",
      "Consent can be revoked at any time from your account settings",
    ],
  },
  "FORM:sleep": {
    title: "Sleep Quality & Rest Informed Consent",
    subtitle: "Assessment of Sleep Patterns and Daytime Rest",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing and review of sleep patterns, rest quality, daytime fatigue, and nighttime breathing indicators by authorized organization administrators and medical personnel.",
    purpose:
      "To evaluate sleep quality, fatigue factors, and nighttime rest indicators for occupational health and energy balance.",
    dataCollected: [
      "Snoring frequency and loudness",
      "Daytime tiredness and energy levels",
      "Observed nighttime breathing pauses",
    ],
    rights: [
      "Responses and risk levels are accessible to authorized organization administrators and medical staff for occupational fatigue and sleep wellness monitoring",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:habits": {
    title: "Lifestyle & Habits Informed Consent",
    subtitle: "Dietary, Activity, and Vitality Profile Assessment",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes the processing and review of physical activity levels, dietary habits, smoking history, and family health indicators by authorized organization administrators and medical staff.",
    purpose:
      "To evaluate lifestyle factors and preventative habits that support overall physical vitality and chronic condition risk management.",
    dataCollected: [
      "Daily physical activity frequency",
      "Vegetable and fruit consumption habits",
      "Smoking status and duration",
      "Blood pressure history and treatment status",
      "Family history of chronic conditions",
    ],
    rights: [
      "Responses and health indicators are visible to authorized organization administrators and medical personnel for preventive wellness programs",
      "You may revoke consent whenever you choose",
    ],
  },
  "FORM:mood": {
    title: "Mood & Emotional Well-being Informed Consent",
    subtitle: "Emotional Wellness and Energy Assessment",
    version: "1.0",
    isHealthSensitive: true,
    crisisNotice: true,
    summary:
      "Authorizes processing and review of responses regarding emotional well-being, mood indicators, and energy levels by authorized organization administrators and medical personnel.",
    purpose:
      "To screen for symptoms of stress, emotional fatigue, and psychological well-being in the workplace. This is a screening tool, not a clinical psychiatric diagnosis.",
    dataCollected: [
      "Standardized frequency indicators on mood, sleep quality, energy, concentration, and emotional state",
    ],
    rights: [
      "Responses and risk scores are accessible to authorized organization administrators and occupational health professionals for well-being assessment and support",
      "If you are experiencing distress, support resources are immediately provided",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:metabolic": {
    title: "Cardiovascular & Metabolic Health Consent",
    subtitle: "Cardiometabolic Vitality and Laboratory Indicators",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes the entry, processing, and review of lipid indicators (cholesterol, HDL, triglycerides), fasting glucose, and blood pressure readings by authorized organization administrators and medical personnel.",
    purpose:
      "To calculate overall cardiovascular health indicators and metabolic vitality insights for occupational preventative care.",
    dataCollected: [
      "Systolic and diastolic blood pressure",
      "Total cholesterol, HDL, and triglycerides",
      "Fasting blood glucose",
      "Prescribed medication usage",
    ],
    rights: [
      "Laboratory parameters and computed risk scores are accessible to authorized organization administrators and medical personnel for preventative occupational health management",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:eoss": {
    title: "Physical & Functional Health Impact Consent",
    subtitle: "Assessment of Daily Mobility and Vitality",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes assessment and review of self-reported physical health, emotional wellness related to body weight, and daily functional mobility by authorized organization administrators and medical staff.",
    purpose:
      "To evaluate the functional impact of weight and physical health on daily vitality and quality of life.",
    dataCollected: [
      "Self-reported physical health stage",
      "Emotional well-being related to body weight",
      "Functional and mobility observations",
    ],
    rights: [
      "Responses and functional stages are accessible to authorized organization administrators and medical staff for occupational wellness guidance",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:nordic_nmq": {
    title: "Musculoskeletal Health & Posture Consent",
    subtitle: "Assessment of Workplace Ergonomics and Postural Comfort",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing and review of musculoskeletal symptoms and discomfort occurrences across body regions by authorized organization administrators and medical staff.",
    purpose:
      "To identify workplace ergonomic strain, posture factors, and musculoskeletal wellness opportunities.",
    dataCollected: [
      "Discomfort occurrences in neck, shoulders, elbows, wrists, spine, hips, knees, ankles",
      "Daily activity impediment history per region",
    ],
    rights: [
      "Responses are visible to authorized organization administrators and medical staff to improve workplace ergonomics and injury prevention",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:audit_c": {
    title: "Habits & Consumption Patterns Consent",
    subtitle: "Assessment of Lifestyle and Consumption Patterns",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing and review of responses regarding beverage consumption frequency and habits by authorized organization administrators and medical staff.",
    purpose:
      "To assess lifestyle consumption habits as part of comprehensive occupational health and wellness programs.",
    dataCollected: [
      "Consumption frequency and typical patterns",
    ],
    rights: [
      "Responses and risk scores are visible to authorized organization administrators and occupational health professionals for preventive wellness programs",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:pss10": {
    title: "Stress & Coping Resilience Consent",
    subtitle: "Assessment of Everyday Stress and Coping Balance",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing and review of responses regarding everyday stress perception, control, and emotional coping balance by authorized organization administrators and medical staff.",
    purpose:
      "To assess perceived workplace stress levels and coping resilience for preventative wellness support.",
    dataCollected: [
      "Rating responses regarding stress perception, control, and emotional coping over the last month",
    ],
    rights: [
      "Responses and stress index scores are visible to authorized organization administrators and occupational health professionals for workplace wellness support",
      "Consent can be revoked at any time",
    ],
  },
}

export function getLegalDocForForm(formType: string): LegalDocInfo {
  return (
    LEGAL_DOCUMENTS[`FORM:${formType}`] ?? {
      title: `${formType.toUpperCase()} Informed Consent`,
      subtitle: "Health assessment questionnaire data processing",
      version: "1.0",
      summary:
        "Authorizes the processing and review of questionnaire answers by authorized organization administrators and medical personnel for occupational health screening and wellness insights.",
      purpose: "Occupational health and preventative wellness analysis.",
      dataCollected: ["Questionnaire responses for " + formType],
      rights: [
        "Data is accessible to authorized organization administrators and medical staff for occupational health purposes",
        "Consent can be revoked at any time",
      ],
    }
  )
}
