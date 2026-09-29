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
      "Checkup360 is committed to safeguarding personal and sensitive data in compliance with personal data protection standards and medical privacy guidelines.",
    purpose:
      "To inform you about data processing activities, storage duration, security measures, and your privacy rights.",
    dataCollected: [
      "Identification & demographic information",
      "Health metrics & assessment questionnaire responses",
      "Technical telemetry and security logs",
    ],
    rights: [
      "Right of access, rectification, update, and deletion (Habeas Data)",
      "Right to withdraw consent at any time without penalty",
      "Right to confidential processing under medical secret standards",
    ],
  },
  HEALTH_DATA_PROCESSING_CONSENT: {
    title: "Health Data Processing Consent",
    subtitle: "General Informed Consent for Occupational Health & Wellness Screening",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Sensitive health data requires your explicit, informed consent. This consent authorizes Checkup360 to process your health measurements and survey responses for preventative health evaluation.",
    purpose:
      "To calculate preventative health and wellness indicators, providing you with personalized health insights while maintaining strict confidentiality.",
    dataCollected: [
      "Anthropometric measurements and biological indicators",
      "Lifestyle, habits, and health questionnaires",
      "Occupational wellness survey responses",
    ],
    rights: [
      "Explicit consent is entirely voluntary and not a condition of employment",
      "Individual health records are strictly confidential and never shared with employers in identifiable form",
      "You may revoke this consent at any time from your account settings",
    ],
  },
  "FORM:biometrics": {
    title: "Physical Biometrics Informed Consent",
    subtitle: "Collection & Analysis of Anthropometric Indicators",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes the collection and evaluation of height, weight, neck circumference, waist circumference, and biological sex for health and wellness indicators.",
    purpose:
      "To determine body composition parameters, weight-to-height indicators, and cardiometabolic wellness insights.",
    dataCollected: [
      "Biological sex",
      "Height & weight (BMI)",
      "Neck and waist circumferences",
    ],
    rights: [
      "Data is used solely for non-diagnostic occupational screening",
      "You can update or delete your biometrics at any time",
      "Consent can be revoked at any time from your account settings",
    ],
  },
  "FORM:sleep": {
    title: "Sleep Quality & Rest Informed Consent",
    subtitle: "Assessment of Sleep Patterns and Daytime Rest",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing of sleep patterns, rest quality, daytime fatigue, and nighttime breathing indicators.",
    purpose:
      "To evaluate sleep quality, fatigue factors, and nighttime rest indicators for occupational health and energy balance.",
    dataCollected: [
      "Snoring frequency and loudness",
      "Daytime tiredness and energy levels",
      "Observed nighttime breathing pauses",
    ],
    rights: [
      "Used exclusively for occupational fatigue and sleep wellness analysis",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:habits": {
    title: "Lifestyle & Habits Informed Consent",
    subtitle: "Dietary, Activity, and Vitality Profile Assessment",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes the processing of physical activity levels, dietary habits, smoking history, and family health indicators.",
    purpose:
      "To evaluate lifestyle factors and preventative habits that support overall physical and cardiovascular vitality.",
    dataCollected: [
      "Daily physical activity frequency",
      "Vegetable and fruit consumption habits",
      "Smoking status and duration",
      "Blood pressure history and treatment status",
      "Family history of chronic conditions",
    ],
    rights: [
      "Results assist in preventative occupational wellness guidance",
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
      "Authorizes processing of responses regarding emotional well-being, mood indicators, and energy levels.",
    purpose:
      "To screen for symptoms of stress, emotional fatigue, and psychological well-being in the workplace. This is a screening tool, not a clinical psychiatric diagnosis.",
    dataCollected: [
      "Standardized frequency indicators on mood, sleep quality, energy, concentration, and emotional state",
    ],
    rights: [
      "Strict confidentiality: Individual answers are encrypted and never shown to employers or supervisors",
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
      "Authorizes the entry and processing of lipid indicators (cholesterol, HDL, triglycerides), fasting glucose, and blood pressure readings.",
    purpose:
      "To calculate overall cardiovascular health indicators and metabolic vitality insights.",
    dataCollected: [
      "Systolic and diastolic blood pressure",
      "Total cholesterol, HDL, and triglycerides",
      "Fasting blood glucose",
      "Prescribed medication usage",
    ],
    rights: [
      "All laboratory parameters are processed under strict medical confidentiality safeguards",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:eoss": {
    title: "Physical & Functional Health Impact Consent",
    subtitle: "Assessment of Daily Mobility and Vitality",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes assessment of self-reported physical health, emotional wellness related to body weight, and daily functional mobility.",
    purpose:
      "To evaluate the functional impact of weight and physical health on daily vitality and quality of life.",
    dataCollected: [
      "Self-reported physical health stage",
      "Emotional well-being related to body weight",
      "Functional and mobility observations",
    ],
    rights: [
      "Used strictly for occupational wellness and functional guidance",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:nordic_nmq": {
    title: "Musculoskeletal Health & Posture Consent",
    subtitle: "Assessment of Workplace Ergonomics and Postural Comfort",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing of musculoskeletal symptoms and discomfort occurrences across body regions.",
    purpose:
      "To identify workplace ergonomic strain, posture factors, and musculoskeletal wellness opportunities.",
    dataCollected: [
      "Discomfort occurrences in neck, shoulders, elbows, wrists, spine, hips, knees, ankles",
      "Daily activity impediment history per region",
    ],
    rights: [
      "Helps improve workplace ergonomics and injury prevention",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:audit_c": {
    title: "Habits & Consumption Patterns Consent",
    subtitle: "Assessment of Lifestyle and Consumption Patterns",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing of responses regarding beverage consumption frequency and habits.",
    purpose:
      "To assess lifestyle consumption habits as part of comprehensive occupational wellness programs.",
    dataCollected: [
      "Consumption frequency and typical patterns",
    ],
    rights: [
      "All responses are confidential and never shared with employers individually",
      "Consent can be revoked at any time",
    ],
  },
  "FORM:pss10": {
    title: "Stress & Coping Resilience Consent",
    subtitle: "Assessment of Everyday Stress and Coping Balance",
    version: "1.0",
    isHealthSensitive: true,
    summary:
      "Authorizes processing of responses regarding everyday stress perception, control, and emotional coping balance.",
    purpose:
      "To assess perceived workplace stress levels and coping resilience for preventative wellness support.",
    dataCollected: [
      "Rating responses regarding stress perception, control, and emotional coping over the last month",
    ],
    rights: [
      "Confidential responses used strictly for wellness analytics and stress mitigation",
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
        "Authorizes the processing of questionnaire answers for occupational health screening and wellness insights.",
      purpose: "Occupational health and preventative wellness analysis.",
      dataCollected: ["Questionnaire responses for " + formType],
      rights: [
        "Data is confidential and protected under privacy standards",
        "Consent can be revoked at any time",
      ],
    }
  )
}
