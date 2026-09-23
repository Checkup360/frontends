import { useEffect, useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  HeartPulse,
  Info,
  Moon,
  Ruler,
  User,
  Weight,
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  fetchActiveMemberForms,
  fetchMemberForm,
  submitMemberForm,
} from "@workspace/api"

type FormType =
  | "biometrics"
  | "sleep"
  | "habits"
  | "mood"
  | "metabolic"
  | "eoss"
  | "nordic_nmq"
  | "audit_c"
  | "pss10"

type StudiesData = {
  // Biometrics
  biological_sex: string
  height: string
  weight: string
  neck_circumference: string
  waist_circumference: string
  triglycerides: string
  total_cholesterol: string
  hdl_cholesterol: string
  systolic_blood_pressure: string
  diastolic_blood_pressure: string
  fasting_glucose: string
  glucose_lowering_medication: string
  eoss_physical_health_stage: string
  eoss_mental_health_stage: string
  eoss_functional_stage: string
  // Laboratory & Metabolic additions
  statins: string
  lab_study_date: string
  // Sleep
  snoring: string
  tired: string
  observed_apnea: string
  // Habits
  hypertension_medication: string
  daily_physical_activity: string
  fruits_vegetables: string
  previous_high_glucose: string
  smoker: string
  family_diabetes: string
  little_interest: string
  feeling_down: string
  sleep_trouble: string
  tired_energy: string
  appetite: string
  feeling_bad: string
  concentration: string
  psychomotor: string
  self_harm_thoughts: string
  // Nordic NMQ ergonomics fields (9 zones x 3 questions)
  nmq_neck_12m: string
  nmq_neck_prevent_12m: string
  nmq_neck_7d: string
  nmq_shoulders_12m: string
  nmq_shoulders_prevent_12m: string
  nmq_shoulders_7d: string
  nmq_upper_back_12m: string
  nmq_upper_back_prevent_12m: string
  nmq_upper_back_7d: string
  nmq_lower_back_12m: string
  nmq_lower_back_prevent_12m: string
  nmq_lower_back_7d: string
  nmq_elbows_12m: string
  nmq_elbows_prevent_12m: string
  nmq_elbows_7d: string
  nmq_wrists_hands_12m: string
  nmq_wrists_hands_prevent_12m: string
  nmq_wrists_hands_7d: string
  nmq_hips_thighs_12m: string
  nmq_hips_thighs_prevent_12m: string
  nmq_hips_thighs_7d: string
  nmq_knees_12m: string
  nmq_knees_prevent_12m: string
  nmq_knees_7d: string
  nmq_ankles_feet_12m: string
  nmq_ankles_feet_prevent_12m: string
  nmq_ankles_feet_7d: string
  // AUDIT-C alcohol risk
  audit_c_frequency: string
  audit_c_quantity: string
  audit_c_heavy_drinking: string
  // PSS-10 perceived stress scale (10 questions)
  pss10_q1: string
  pss10_q2: string
  pss10_q3: string
  pss10_q4: string
  pss10_q5: string
  pss10_q6: string
  pss10_q7: string
  pss10_q8: string
  pss10_q9: string
  pss10_q10: string
}

const initialData: StudiesData = {
  biological_sex: "",
  height: "",
  weight: "",
  neck_circumference: "",
  waist_circumference: "",
  triglycerides: "",
  total_cholesterol: "",
  hdl_cholesterol: "",
  systolic_blood_pressure: "",
  diastolic_blood_pressure: "",
  fasting_glucose: "",
  glucose_lowering_medication: "",
  statins: "",
  lab_study_date: "",
  eoss_physical_health_stage: "",
  eoss_mental_health_stage: "",
  eoss_functional_stage: "",
  snoring: "",
  tired: "",
  observed_apnea: "",
  hypertension_medication: "",
  daily_physical_activity: "",
  fruits_vegetables: "",
  previous_high_glucose: "",
  smoker: "",
  family_diabetes: "",
  little_interest: "",
  feeling_down: "",
  sleep_trouble: "",
  tired_energy: "",
  appetite: "",
  feeling_bad: "",
  concentration: "",
  psychomotor: "",
  self_harm_thoughts: "",
  nmq_neck_12m: "",
  nmq_neck_prevent_12m: "",
  nmq_neck_7d: "",
  nmq_shoulders_12m: "",
  nmq_shoulders_prevent_12m: "",
  nmq_shoulders_7d: "",
  nmq_upper_back_12m: "",
  nmq_upper_back_prevent_12m: "",
  nmq_upper_back_7d: "",
  nmq_lower_back_12m: "",
  nmq_lower_back_prevent_12m: "",
  nmq_lower_back_7d: "",
  nmq_elbows_12m: "",
  nmq_elbows_prevent_12m: "",
  nmq_elbows_7d: "",
  nmq_wrists_hands_12m: "",
  nmq_wrists_hands_prevent_12m: "",
  nmq_wrists_hands_7d: "",
  nmq_hips_thighs_12m: "",
  nmq_hips_thighs_prevent_12m: "",
  nmq_hips_thighs_7d: "",
  nmq_knees_12m: "",
  nmq_knees_prevent_12m: "",
  nmq_knees_7d: "",
  nmq_ankles_feet_12m: "",
  nmq_ankles_feet_prevent_12m: "",
  nmq_ankles_feet_7d: "",
  audit_c_frequency: "",
  audit_c_quantity: "",
  audit_c_heavy_drinking: "",
  pss10_q1: "",
  pss10_q2: "",
  pss10_q3: "",
  pss10_q4: "",
  pss10_q5: "",
  pss10_q6: "",
  pss10_q7: "",
  pss10_q8: "",
  pss10_q9: "",
  pss10_q10: "",
}

const NMQ_ANATOMICAL_ZONES = [
  { id: "neck", name: "Neck" },
  { id: "shoulders", name: "Shoulders" },
  { id: "upper_back", name: "Upper Back" },
  { id: "lower_back", name: "Lower Back" },
  { id: "elbows", name: "Elbows" },
  { id: "wrists_hands", name: "Wrists / Hands" },
  { id: "hips_thighs", name: "Hips / Thighs" },
  { id: "knees", name: "Knees" },
  { id: "ankles_feet", name: "Ankles / Feet" },
] as const

const AUDIT_C_QUESTIONS = [
  {
    field: "audit_c_frequency" as keyof StudiesData,
    title: "1. How often do you have a drink containing alcohol?",
    options: [
      { value: "0", label: "Never" },
      { value: "1", label: "Monthly or less" },
      { value: "2", label: "2 to 4 times a month" },
      { value: "3", label: "2 to 3 times a week" },
      { value: "4", label: "4 or more times a week" },
    ],
  },
  {
    field: "audit_c_quantity" as keyof StudiesData,
    title: "2. How many drinks containing alcohol do you have on a typical day when you are drinking?",
    options: [
      { value: "0", label: "1 or 2" },
      { value: "1", label: "3 or 4" },
      { value: "2", label: "5 or 6" },
      { value: "3", label: "7 to 9" },
      { value: "4", label: "10 or more" },
    ],
  },
  {
    field: "audit_c_heavy_drinking" as keyof StudiesData,
    title: "3. How often do you have six or more drinks on one occasion?",
    options: [
      { value: "0", label: "Never" },
      { value: "1", label: "Less than monthly" },
      { value: "2", label: "Monthly" },
      { value: "3", label: "Weekly" },
      { value: "4", label: "Daily or almost daily" },
    ],
  },
]

const PSS10_LIKERT_OPTIONS = [
  { value: "0", label: "Never" },
  { value: "1", label: "Almost never" },
  { value: "2", label: "Sometimes" },
  { value: "3", label: "Fairly often" },
  { value: "4", label: "Very often" },
]

const PSS10_QUESTIONS: Array<{
  field: keyof StudiesData
  prompt: string
  isReversed?: boolean
}> = [
  { field: "pss10_q1", prompt: "1. In the last month, how often have you been upset because of something that happened unexpectedly?" },
  { field: "pss10_q2", prompt: "2. In the last month, how often have you felt that you were unable to control the important things in your life?" },
  { field: "pss10_q3", prompt: "3. In the last month, how often have you felt nervous and stressed?" },
  { field: "pss10_q4", prompt: "4. In the last month, how often have you felt confident about your ability to handle your personal problems?", isReversed: true },
  { field: "pss10_q5", prompt: "5. In the last month, how often have you felt that things were going your way?", isReversed: true },
  { field: "pss10_q6", prompt: "6. In the last month, how often have you found that you could not cope with all the things that you had to do?" },
  { field: "pss10_q7", prompt: "7. In the last month, how often have you been able to control irritations in your life?", isReversed: true },
  { field: "pss10_q8", prompt: "8. In the last month, how often have you felt that you were on top of things?", isReversed: true },
  { field: "pss10_q9", prompt: "9. In the last month, how often have you been angered because of things that were outside of your control?" },
  { field: "pss10_q10", prompt: "10. In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?" },
]


const PHQ9_QUESTIONS: Array<{ field: keyof StudiesData; prompt: string }> = [
  { field: "little_interest", prompt: "Little interest or pleasure in doing things?" },
  { field: "feeling_down", prompt: "Feeling down, depressed, or hopeless?" },
  { field: "sleep_trouble", prompt: "Trouble falling or staying asleep, or sleeping too much?" },
  { field: "tired_energy", prompt: "Feeling tired or having little energy?" },
  { field: "appetite", prompt: "Poor appetite or overeating?" },
  { field: "feeling_bad", prompt: "Feeling bad about yourself, or that you are a failure?" },
  { field: "concentration", prompt: "Trouble concentrating on things?" },
  { field: "psychomotor", prompt: "Moving or speaking so slowly that others could notice, or being unusually fidgety?" },
  { field: "self_harm_thoughts", prompt: "Thoughts that you would be better off dead or of hurting yourself in some way?" },
]

const isLabStudyObsolete = (dateStr: string): boolean => {
  if (!dateStr) return false
  const studyDate = new Date(dateStr)
  if (isNaN(studyDate.getTime())) return false
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  return studyDate < twelveMonthsAgo
}

const EOSS_SECTIONS = [
  {
    field: "eoss_physical_health_stage" as keyof StudiesData,
    title: "Physical Health",
    subtitle: "Select the statement that best describes your current physical health and symptoms:",
    options: [
      { value: "0", description: "I have no physical pain or health issues." },
      { value: "1", description: "I experience mild pain or slight shortness of breath with effort, but it does not prevent me from working." },
      { value: "2", description: "I have chronic pain (e.g., knee, back) or symptoms that make daily tasks difficult." },
      { value: "3", description: "I have significant physical problems or medical complications that prevent me from working normally." },
      { value: "4", description: "I have severe physical limitations or incapacity to perform my daily activities." },
    ],
  },
  {
    field: "eoss_mental_health_stage" as keyof StudiesData,
    title: "Mental & Emotional Health",
    subtitle: "Select the statement that best describes your psychological well-being and stress levels:",
    options: [
      { value: "0", description: "I feel good, with no psychological distress or anxiety about my body or health." },
      { value: "1", description: "I sometimes feel mild dissatisfaction or emotional distress, but it does not affect my daily life." },
      { value: "2", description: "I feel frequent emotional distress, stress, or low mood regarding my health or body." },
      { value: "3", description: "I feel significant anxiety or low mood that affects my well-being and work/family environment." },
      { value: "4", description: "I feel severe psychological distress that seriously compromises my personal and work life." },
    ],
  },
  {
    field: "eoss_functional_stage" as keyof StudiesData,
    title: "Daily Function & Work Capacity",
    subtitle: "Select the statement that best describes your mobility, stamina, and daily performance:",
    options: [
      { value: "0", description: "I perform all my daily and work tasks without any difficulty." },
      { value: "1", description: "I can fulfill all my tasks, although I tire a bit more than usual." },
      { value: "2", description: "I find it difficult to perform intense physical activities or demanding tasks at work." },
      { value: "3", description: "I have significant difficulty completing my work shift or household chores." },
      { value: "4", description: "I am unable or severely limited in performing my daily and work activities." },
    ],
  },
]



export function MemberFormsStudiesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const formType: FormType =
    (searchParams.get("form") as FormType) ||
    (searchParams.get("tab") as FormType) ||
    "biometrics"

  const [data, setData] = useState<StudiesData>(initialData)
  const [activeFormsMap, setActiveFormsMap] = useState<Record<string, Set<string>>>({})
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  const isFieldActive = (form: FormType, field: string): boolean => {
    if (activeFormsMap[form]) {
      return activeFormsMap[form].has(field)
    }
    return true
  }

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setIsLoadingData(true)
      const [
        activeFormsRes,
        biometricsForm,
        sleepForm,
        habitsForm,
        moodForm,
        metabolicForm,
        eossForm,
        nmqForm,
        auditForm,
        pssForm,
      ] = await Promise.all([
        fetchActiveMemberForms(),
        fetchMemberForm("biometrics"),
        fetchMemberForm("sleep"),
        fetchMemberForm("habits"),
        fetchMemberForm("mood"),
        fetchMemberForm("metabolic"),
        fetchMemberForm("eoss"),
        fetchMemberForm("nordic_nmq"),
        fetchMemberForm("audit_c"),
        fetchMemberForm("pss10"),
      ])

      if (!cancelled) {
        if (activeFormsRes?.active_forms) {
          const map: Record<string, Set<string>> = {}
          for (const formDef of activeFormsRes.active_forms) {
            map[formDef.form_type] = new Set(formDef.fields)
          }
          setActiveFormsMap(map)
        }
        const bioData = biometricsForm?.data || {}
        const sleepData = sleepForm?.data || {}
        const habitsData = habitsForm?.data || {}
        const moodData = moodForm?.data || {}
        const metabolicData = metabolicForm?.data || {}
        const eossData = eossForm?.data || {}
        const nmqData = (nmqForm?.data?.nordic_nmq_data as Record<string, Record<string, boolean>>) || {}
        const auditData = auditForm?.data || {}
        const pssData = pssForm?.data || {}

        const biologicalSex = (bioData.biological_sex as string) || ""
        const heightVal = bioData.height ? String(bioData.height) : ""
        const weightVal = bioData.weight ? String(bioData.weight) : ""

        const extractedNmq: Record<string, string> = {}
        const zonesList = [
          "neck",
          "shoulders",
          "upper_back",
          "lower_back",
          "elbows",
          "wrists_hands",
          "hips_thighs",
          "knees",
          "ankles_feet",
        ] as const
        for (const z of zonesList) {
          const zObj = nmqData[z] || {}
          extractedNmq[`nmq_${z}_12m`] = zObj.trouble_last_12_months !== undefined ? String(zObj.trouble_last_12_months) : ""
          extractedNmq[`nmq_${z}_prevent_12m`] = zObj.prevented_work_last_12_months !== undefined ? String(zObj.prevented_work_last_12_months) : ""
          extractedNmq[`nmq_${z}_7d`] = zObj.trouble_last_7_days !== undefined ? String(zObj.trouble_last_7_days) : ""
        }

        const extractedPss: Record<string, string> = {}
        for (let i = 1; i <= 10; i++) {
          const key = `pss10_q${i}`
          extractedPss[key] = pssData[key] !== undefined ? String(pssData[key]) : ""
        }

        setData({
          biological_sex: biologicalSex,
          height: heightVal,
          weight: weightVal,
          waist_circumference: bioData.waist_circumference
            ? String(bioData.waist_circumference)
            : "",
          triglycerides: metabolicData.triglycerides !== undefined ? String(metabolicData.triglycerides) : "",
          total_cholesterol: metabolicData.total_cholesterol !== undefined ? String(metabolicData.total_cholesterol) : "",
          hdl_cholesterol: metabolicData.hdl_cholesterol !== undefined ? String(metabolicData.hdl_cholesterol) : "",
          systolic_blood_pressure: metabolicData.systolic_blood_pressure !== undefined ? String(metabolicData.systolic_blood_pressure) : "",
          diastolic_blood_pressure: metabolicData.diastolic_blood_pressure !== undefined ? String(metabolicData.diastolic_blood_pressure) : "",
          fasting_glucose: metabolicData.fasting_glucose !== undefined ? String(metabolicData.fasting_glucose) : "",
          glucose_lowering_medication: metabolicData.glucose_lowering_medication !== undefined ? String(metabolicData.glucose_lowering_medication) : "",
          statins: metabolicData.statins !== undefined ? String(metabolicData.statins) : "",
          lab_study_date: (metabolicData.lab_study_date as string) || "",
          eoss_physical_health_stage: eossData.eoss_physical_health_stage !== undefined ? String(eossData.eoss_physical_health_stage) : "",
          eoss_mental_health_stage: eossData.eoss_mental_health_stage !== undefined ? String(eossData.eoss_mental_health_stage) : "",
          eoss_functional_stage: eossData.eoss_functional_stage !== undefined ? String(eossData.eoss_functional_stage) : "",
          neck_circumference: sleepData.neck_circumference
            ? String(sleepData.neck_circumference)
            : bioData.neck_circumference
            ? String(bioData.neck_circumference)
            : "",
          snoring: sleepData.snoring !== undefined ? String(sleepData.snoring) : "",
          tired: sleepData.tired !== undefined ? String(sleepData.tired) : "",
          observed_apnea:
            sleepData.observed_apnea !== undefined
              ? String(sleepData.observed_apnea)
              : "",
          hypertension_medication:
            habitsData.hypertension_medication !== undefined
              ? String(habitsData.hypertension_medication)
              : "",
          daily_physical_activity:
            habitsData.daily_physical_activity !== undefined
              ? String(habitsData.daily_physical_activity)
              : "",
          fruits_vegetables:
            habitsData.fruits_vegetables !== undefined
              ? String(habitsData.fruits_vegetables)
              : "",
          previous_high_glucose:
            habitsData.previous_high_glucose !== undefined
              ? String(habitsData.previous_high_glucose)
              : "",
          smoker:
            habitsData.smoker !== undefined
              ? String(habitsData.smoker)
              : "",
          family_diabetes: (habitsData.family_diabetes as string) || "",
          little_interest: moodData.little_interest !== undefined ? String(moodData.little_interest) : "",
          feeling_down: moodData.feeling_down !== undefined ? String(moodData.feeling_down) : "",
          sleep_trouble: moodData.sleep_trouble !== undefined ? String(moodData.sleep_trouble) : "",
          tired_energy: moodData.tired_energy !== undefined ? String(moodData.tired_energy) : "",
          appetite: moodData.appetite !== undefined ? String(moodData.appetite) : "",
          feeling_bad: moodData.feeling_bad !== undefined ? String(moodData.feeling_bad) : "",
          concentration: moodData.concentration !== undefined ? String(moodData.concentration) : "",
          psychomotor: moodData.psychomotor !== undefined ? String(moodData.psychomotor) : "",
          self_harm_thoughts: moodData.self_harm_thoughts !== undefined ? String(moodData.self_harm_thoughts) : "",
          audit_c_frequency: auditData.audit_c_frequency !== undefined ? String(auditData.audit_c_frequency) : "",
          audit_c_quantity: auditData.audit_c_quantity !== undefined ? String(auditData.audit_c_quantity) : "",
          ...extractedNmq,
          ...extractedPss,
        } as StudiesData)


        setIsLoadingData(false)
      }
    }
    void loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const updateField = (field: keyof StudiesData, value: string) => {
    setData((current) => ({ ...current, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
    setGlobalError(null)
  }

  const scrollToFirstError = (errorsObj: Record<string, string>) => {
    const firstErrorKey = Object.keys(errorsObj)[0]
    if (firstErrorKey) {
      const el = document.getElementById(`field-group-${firstErrorKey}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  const handleSaveBiometrics = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!data.biological_sex) {
      errors.biological_sex = "Please select biological sex."
    }
    if (
      !data.height ||
      isNaN(Number(data.height)) ||
      Number(data.height) <= 0 ||
      Number(data.height) >= 300
    ) {
      errors.height = "Please enter a valid height in centimeters (cm)."
    }
    if (
      !data.weight ||
      isNaN(Number(data.weight)) ||
      Number(data.weight) <= 0 ||
      Number(data.weight) >= 500
    ) {
      errors.weight = "Please enter a valid weight in kilograms (kg)."
    }
    if (
      isFieldActive("biometrics", "neck_circumference") &&
      (!data.neck_circumference ||
        isNaN(Number(data.neck_circumference)) ||
        Number(data.neck_circumference) <= 0)
    ) {
      errors.neck_circumference = "Please enter a valid neck circumference (cm)."
    }
    if (
      !data.waist_circumference ||
      isNaN(Number(data.waist_circumference)) ||
      Number(data.waist_circumference) <= 0
    ) {
      errors.waist_circumference = "Please enter a valid waist circumference (cm)."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const payload: Record<string, string | number | boolean | null | undefined> = {
      biological_sex: data.biological_sex,
      height: Number(data.height),
      weight: Number(data.weight),
      waist_circumference: Number(data.waist_circumference),
    }
    if (isFieldActive("biometrics", "neck_circumference")) {
      payload.neck_circumference = Number(data.neck_circumference)
    }

    const res = await submitMemberForm("biometrics", payload)
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save physical biometrics.")
    } else {
      toast.success("Physical biometrics saved successfully.")
      navigate("/forms")
    }
  }

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!data.snoring) errors.snoring = "Please select an option for snoring."
    if (!data.tired) errors.tired = "Please select an option for daytime fatigue."
    if (!data.observed_apnea)
      errors.observed_apnea = "Please select an option for sleep apnea observation."

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const res = await submitMemberForm("sleep", {
      snoring: data.snoring === "true",
      tired: data.tired === "true",
      observed_apnea: data.observed_apnea === "true",
      neck_circumference: Number(data.neck_circumference) || undefined,
    })
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save sleep quality data.")
    } else {
      toast.success("Sleep quality data saved successfully.")
      navigate("/forms")
    }
  }

  const handleSaveHabits = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!data.hypertension_medication)
      errors.hypertension_medication =
        "Please select an option for blood pressure medication."
    if (!data.daily_physical_activity)
      errors.daily_physical_activity =
        "Please select an option for daily physical activity."
    if (!data.fruits_vegetables)
      errors.fruits_vegetables =
        "Please select an option for fruit/vegetable consumption."
    if (!data.previous_high_glucose)
      errors.previous_high_glucose =
        "Please select an option for previous high blood glucose."
    if (!data.smoker)
      errors.smoker = "Please select an option for smoking status."
    if (!data.family_diabetes)
      errors.family_diabetes = "Please select an option for family history of diabetes."

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const res = await submitMemberForm("habits", {
      daily_physical_activity: data.daily_physical_activity === "true",
      fruits_vegetables: data.fruits_vegetables === "true",
      hypertension_medication: data.hypertension_medication === "true",
      previous_high_glucose: data.previous_high_glucose === "true",
      smoker: data.smoker === "true",
      family_diabetes: data.family_diabetes,
    })
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save lifestyle habits.")
    } else {
      toast.success("Lifestyle & habits saved successfully.")
      navigate("/forms")
    }
  }

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    const phq9Fields: Array<keyof StudiesData> = [
      "little_interest",
      "feeling_down",
      "sleep_trouble",
      "tired_energy",
      "appetite",
      "feeling_bad",
      "concentration",
      "psychomotor",
      "self_harm_thoughts",
    ]
    for (const field of phq9Fields) {
      if (data[field] === "") {
        errors[field] = "Please select an option."
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const answers = phq9Fields.reduce<Record<string, number>>((acc, field) => {
      acc[field] = Number(data[field])
      return acc
    }, {})
    const res = await submitMemberForm("mood", answers)
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save mood assessment.")
    } else {
      toast.success("Mood assessment saved successfully.")
      navigate("/forms")
    }
  }

  const handleSaveMetabolic = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    const numericFields: Array<keyof StudiesData> = [
      "triglycerides",
      "total_cholesterol",
      "hdl_cholesterol",
      "systolic_blood_pressure",
      "diastolic_blood_pressure",
      "fasting_glucose",
    ]
    for (const field of numericFields) {
      if (!data[field] || Number(data[field]) <= 0 || Number.isNaN(Number(data[field]))) {
        errors[field] = "Please enter a valid value."
      }
    }
    // Validation: Systolic blood pressure strictly greater than diastolic
    if (
      data.systolic_blood_pressure &&
      data.diastolic_blood_pressure &&
      Number(data.systolic_blood_pressure) <= Number(data.diastolic_blood_pressure)
    ) {
      errors.systolic_blood_pressure =
        "Systolic blood pressure must be strictly greater than diastolic blood pressure."
    }
    if (!data.glucose_lowering_medication) {
      errors.glucose_lowering_medication = "Please select an option."
    }
    if (!data.statins) {
      errors.statins = "Please select an option for statin (cholesterol medication) usage."
    }
    if (!data.lab_study_date) {
      errors.lab_study_date = "Please enter the date of your laboratory study."
    } else if (isLabStudyObsolete(data.lab_study_date)) {
      errors.lab_study_date = "Laboratory study results are obsolete (older than 12 months). Please provide recent lab test results."
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const res = await submitMemberForm("metabolic", {
      triglycerides: Number(data.triglycerides),
      total_cholesterol: Number(data.total_cholesterol),
      hdl_cholesterol: Number(data.hdl_cholesterol),
      systolic_blood_pressure: Number(data.systolic_blood_pressure),
      diastolic_blood_pressure: Number(data.diastolic_blood_pressure),
      fasting_glucose: Number(data.fasting_glucose),
      glucose_lowering_medication: data.glucose_lowering_medication === "true",
      statins: data.statins === "true",
      lab_study_date: data.lab_study_date,
    })
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save metabolic health data.")
    } else {
      toast.success("Metabolic health data saved successfully.")
      navigate("/forms")
    }
  }

  const handleSaveEoss = async (e: React.FormEvent) => {
    e.preventDefault()
    const fields: Array<keyof StudiesData> = [
      "eoss_physical_health_stage",
      "eoss_mental_health_stage",
      "eoss_functional_stage",
    ]
    const errors: Record<string, string> = {}
    for (const field of fields) {
      if (data[field] === "") errors[field] = "Please select a stage."
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const res = await submitMemberForm("eoss", {
      eoss_physical_health_stage: Number(data.eoss_physical_health_stage),
      eoss_mental_health_stage: Number(data.eoss_mental_health_stage),
      eoss_functional_stage: Number(data.eoss_functional_stage),
    })
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save obesity-related health impact.")
    } else {
      toast.success("Obesity-related health impact saved successfully.")
      navigate("/forms")
    }
  }

  const handleSaveNordicNmq = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    const zones = [
      "neck",
      "shoulders",
      "upper_back",
      "lower_back",
      "elbows",
      "wrists_hands",
      "hips_thighs",
      "knees",
      "ankles_feet",
    ] as const

    for (const z of zones) {
      if ((data as Record<string, string>)[`nmq_${z}_12m`] === "") {
        errors[`nmq_${z}_12m`] = "Please select an option for 12-month trouble."
      }
      if ((data as Record<string, string>)[`nmq_${z}_prevent_12m`] === "") {
        errors[`nmq_${z}_prevent_12m`] = "Please select an option for work prevention."
      }
      if ((data as Record<string, string>)[`nmq_${z}_7d`] === "") {
        errors[`nmq_${z}_7d`] = "Please select an option for 7-day trouble."
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const formattedZones: Record<string, { trouble_last_12_months: boolean; prevented_work_last_12_months: boolean; trouble_last_7_days: boolean }> = {}
    for (const z of zones) {
      formattedZones[z] = {
        trouble_last_12_months: (data as Record<string, string>)[`nmq_${z}_12m`] === "true",
        prevented_work_last_12_months: (data as Record<string, string>)[`nmq_${z}_prevent_12m`] === "true",
        trouble_last_7_days: (data as Record<string, string>)[`nmq_${z}_7d`] === "true",
      }
    }

    const res = await submitMemberForm("nordic_nmq", {
      nordic_nmq_data: formattedZones,
    })
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save Nordic ergonomics questionnaire.")
    } else {
      toast.success("Nordic ergonomics questionnaire saved successfully.")
      navigate("/forms")
    }
  }

  const handleSaveAuditC = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (data.audit_c_frequency === "") errors.audit_c_frequency = "Please select drinking frequency."
    if (data.audit_c_quantity === "") errors.audit_c_quantity = "Please select typical drinking quantity."
    if (data.audit_c_heavy_drinking === "") errors.audit_c_heavy_drinking = "Please select heavy drinking frequency."

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const res = await submitMemberForm("audit_c", {
      audit_c_frequency: Number(data.audit_c_frequency),
      audit_c_quantity: Number(data.audit_c_quantity),
      audit_c_heavy_drinking: Number(data.audit_c_heavy_drinking),
    })
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save AUDIT-C assessment.")
    } else {
      toast.success("AUDIT-C alcohol risk assessment saved successfully.")
      navigate("/forms")
    }
  }

  const handleSavePss10 = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    for (let i = 1; i <= 10; i++) {
      const field = `pss10_q${i}` as keyof StudiesData
      if (data[field] === "") {
        errors[field] = "Please select an answer."
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const payload: Record<string, number> = {}
    for (let i = 1; i <= 10; i++) {
      payload[`pss10_q${i}`] = Number((data as Record<string, string>)[`pss10_q${i}`])
    }

    const res = await submitMemberForm("pss10", payload)
    setIsSubmitting(false)

    if (res.error) {
      setGlobalError(res.error.message || "Failed to save PSS-10 perceived stress scale.")
    } else {
      toast.success("Perceived Stress & Burnout (PSS-10) saved successfully.")
      navigate("/forms")
    }
  }

  const titlesMap: Record<
    FormType,
    { title: string; description: string; icon: typeof Activity }
  > = {
    biometrics: {
      title: "Physical Biometrics Form",
      description:
        "Review and update your body measurements and physical parameters.",
      icon: Activity,
    },
    sleep: {
      title: "Sleep Quality Form",
      description: "Answer questions regarding your daily sleep habits and rest.",
      icon: Moon,
    },
    habits: {
      title: "Lifestyle & Habits Form",
      description:
        "Information regarding physical activity, diet, and health history.",
      icon: HeartPulse,
    },
    mood: {
      title: "Mood & Well-being Form",
      description: "Answer questions about how you have felt during the last two weeks.",
      icon: HeartPulse,
    },
    metabolic: {
      title: "Metabolic Health Form",
      description: "Record measurements used to assess metabolic health.",
      icon: Activity,
    },
    eoss: {
      title: "Obesity-related Health Impact",
      description: "Reflect on how your health, mood, and daily function are affected.",
      icon: HeartPulse,
    },
    nordic_nmq: {
      title: "Musculoskeletal Risk (NMQ)",
      description: "Standardized Nordic Questionnaire evaluating body regions for trouble and work impact.",
      icon: Activity,
    },
    audit_c: {
      title: "Alcohol Risk Assessment (AUDIT-C)",
      description: "WHO 3-item questionnaire evaluating alcohol consumption and risk behaviors.",
      icon: HeartPulse,
    },
    pss10: {
      title: "Perceived Stress & Burnout (PSS-10)",
      description: "10-item scale assessing perceived stress and coping capacity over the past month.",
      icon: HeartPulse,
    },
  }


  const currentTitle = titlesMap[formType] || titlesMap.biometrics
  const TitleIcon = currentTitle.icon

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80">
            <TitleIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {currentTitle.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentTitle.description}
            </p>
          </div>
        </div>
      </div>

      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Save Error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* FORM 1: BIOMETRICS */}
      {formType === "biometrics" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Physical Biometrics</CardTitle>
            <CardDescription>
              Physical parameters pre-filled from your onboarding baseline.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveBiometrics(e)}>
            <CardContent className="space-y-6">
              <Alert variant="info" className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs text-muted-foreground">
                  Height, weight, and biological sex are pre-filled from your onboarding profile. Updating them here keeps your health biometrics up to date.
                </AlertDescription>
              </Alert>

              {/* Biological Sex */}
              <div
                id="field-group-biological_sex"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.biological_sex &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="flex items-center gap-2 font-medium">
                  <User className="size-4 text-muted-foreground" />
                  Biological Sex
                </Label>
                <RadioGroup
                  value={data.biological_sex}
                  onValueChange={(val) => updateField("biological_sex", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="M" id="sex-male" />
                    <Label
                      htmlFor="sex-male"
                      className="cursor-pointer font-normal"
                    >
                      Male
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="F" id="sex-female" />
                    <Label
                      htmlFor="sex-female"
                      className="cursor-pointer font-normal"
                    >
                      Female
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.biological_sex && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.biological_sex}
                  </p>
                )}
              </div>

              {/* Biometrics Measurements */}
              <div
                className={cn(
                  "grid gap-6",
                  isFieldActive("biometrics", "neck_circumference")
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 md:grid-cols-3"
                )}
              >
                <div
                  id="field-group-height"
                  className={cn(
                    "space-y-2 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                    fieldErrors.height &&
                      "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <Label htmlFor="height" className="font-medium">
                    Height (cm)
                  </Label>
                  <div className="relative">
                    <Ruler className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={data.height}
                      onChange={(e) => updateField("height", e.target.value)}
                      disabled={isSubmitting || isLoadingData}
                      className={cn(
                        "rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60",
                        fieldErrors.height &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  {fieldErrors.height && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors.height}
                    </p>
                  )}
                </div>

                <div
                  id="field-group-weight"
                  className={cn(
                    "space-y-2 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                    fieldErrors.weight &&
                      "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <Label htmlFor="weight" className="font-medium">
                    Weight (kg)
                  </Label>
                  <div className="relative">
                    <Weight className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={data.weight}
                      onChange={(e) => updateField("weight", e.target.value)}
                      disabled={isSubmitting || isLoadingData}
                      className={cn(
                        "rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60",
                        fieldErrors.weight &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  {fieldErrors.weight && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors.weight}
                    </p>
                  )}
                </div>

                {isFieldActive("biometrics", "neck_circumference") && (
                  <div
                    id="field-group-neck_circumference"
                    className={cn(
                      "space-y-2 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                      fieldErrors.neck_circumference &&
                        "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                    )}
                  >
                    <Label htmlFor="neck_circumference" className="font-medium">
                      Neck Circumference (cm)
                    </Label>
                    <div className="relative">
                      <Ruler className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="neck_circumference"
                        type="number"
                        placeholder="38"
                        value={data.neck_circumference}
                        onChange={(e) => updateField("neck_circumference", e.target.value)}
                        disabled={isSubmitting || isLoadingData}
                        className={cn(
                          "rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60",
                          fieldErrors.neck_circumference &&
                            "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                    </div>
                    {fieldErrors.neck_circumference && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                        <AlertCircle className="size-3.5 shrink-0" />
                        {fieldErrors.neck_circumference}
                      </p>
                    )}
                  </div>
                )}

                <div
                  id="field-group-waist_circumference"
                  className={cn(
                    "space-y-2 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                    fieldErrors.waist_circumference &&
                      "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <Label htmlFor="waist_circumference" className="font-medium">
                    Waist Circumference (cm)
                  </Label>
                  <div className="relative">
                    <Ruler className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="waist_circumference"
                      type="number"
                      placeholder="85"
                      value={data.waist_circumference}
                      onChange={(e) => updateField("waist_circumference", e.target.value)}
                      disabled={isSubmitting || isLoadingData}
                      className={cn(
                        "rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60",
                        fieldErrors.waist_circumference &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  {fieldErrors.waist_circumference && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors.waist_circumference}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Biometrics"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* FORM 2: SLEEP */}
      {formType === "sleep" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Sleep Quality & Rest</CardTitle>
            <CardDescription>
              Answer questions regarding your daily sleep habits.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveSleep(e)}>
            <CardContent className="space-y-6">
              {/* Question 1 */}
              <div
                id="field-group-snoring"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.snoring &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Do you snore loudly (loud enough to be heard through closed doors or your partner elbows you for snoring at night)?
                </Label>
                <RadioGroup
                  value={data.snoring}
                  onValueChange={(val) => updateField("snoring", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="snoring-yes" />
                    <Label
                      htmlFor="snoring-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="snoring-no" />
                    <Label
                      htmlFor="snoring-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.snoring && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.snoring}
                  </p>
                )}
              </div>

              {/* Question 2 */}
              <div
                id="field-group-tired"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.tired &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Do you often feel tired, fatigued, or sleepy during daytime (such as falling asleep during driving or talking to someone)?
                </Label>
                <RadioGroup
                  value={data.tired}
                  onValueChange={(val) => updateField("tired", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="tired-yes" />
                    <Label
                      htmlFor="tired-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="tired-no" />
                    <Label
                      htmlFor="tired-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.tired && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.tired}
                  </p>
                )}
              </div>

              {/* Question 3 */}
              <div
                id="field-group-observed_apnea"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.observed_apnea &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Has anyone observed you stop breathing, choking or gasping during your sleep?
                </Label>
                <RadioGroup
                  value={data.observed_apnea}
                  onValueChange={(val) => updateField("observed_apnea", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="apnea-yes" />
                    <Label
                      htmlFor="apnea-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="apnea-no" />
                    <Label
                      htmlFor="apnea-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.observed_apnea && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.observed_apnea}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Sleep Data"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* FORM 3: HABITS */}
      {formType === "habits" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Lifestyle & Daily Habits</CardTitle>
            <CardDescription>
              Information regarding physical activity, diet, and family health history.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveHabits(e)}>
            <CardContent className="space-y-6">
              {/* Question 1 */}
              <div
                id="field-group-hypertension_medication"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.hypertension_medication &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Are you currently taking medication for high blood pressure?
                </Label>
                <RadioGroup
                  value={data.hypertension_medication}
                  onValueChange={(val) => updateField("hypertension_medication", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="hyp-yes" />
                    <Label
                      htmlFor="hyp-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="hyp-no" />
                    <Label
                      htmlFor="hyp-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.hypertension_medication && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.hypertension_medication}
                  </p>
                )}
              </div>

              {/* Question 2 */}
              <div
                id="field-group-daily_physical_activity"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.daily_physical_activity &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Do you do at least 30 minutes of physical activity every day at work or during leisure time?
                </Label>
                <RadioGroup
                  value={data.daily_physical_activity}
                  onValueChange={(val) => updateField("daily_physical_activity", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="pa-yes" />
                    <Label
                      htmlFor="pa-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="pa-no" />
                    <Label
                      htmlFor="pa-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.daily_physical_activity && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.daily_physical_activity}
                  </p>
                )}
              </div>

              {/* Question 3 */}
              <div
                id="field-group-fruits_vegetables"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.fruits_vegetables &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  How often do you eat vegetables, fruit, or berries?
                </Label>
                <RadioGroup
                  value={data.fruits_vegetables}
                  onValueChange={(val) => updateField("fruits_vegetables", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="fv-yes" />
                    <Label
                      htmlFor="fv-yes"
                      className="cursor-pointer font-normal"
                    >
                      Every day
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="fv-no" />
                    <Label
                      htmlFor="fv-no"
                      className="cursor-pointer font-normal"
                    >
                      Not every day
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.fruits_vegetables && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.fruits_vegetables}
                  </p>
                )}
              </div>

              {/* Question 4 */}
              <div
                id="field-group-previous_high_glucose"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.previous_high_glucose &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Have you ever been found to have high blood glucose (e.g. in a health examination or during illness)?
                </Label>
                <RadioGroup
                  value={data.previous_high_glucose}
                  onValueChange={(val) => updateField("previous_high_glucose", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="hg-yes" />
                    <Label
                      htmlFor="hg-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="hg-no" />
                    <Label
                      htmlFor="hg-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.previous_high_glucose && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.previous_high_glucose}
                  </p>
                )}
              </div>

              {/* Question 5: Smoking status */}
              <div
                id="field-group-smoker"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.smoker &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Do you currently smoke cigarettes or use tobacco products?
                </Label>
                <RadioGroup
                  value={data.smoker}
                  onValueChange={(val) => updateField("smoker", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="smoker-yes" />
                    <Label
                      htmlFor="smoker-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="smoker-no" />
                    <Label
                      htmlFor="smoker-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.smoker && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.smoker}
                  </p>
                )}
              </div>

              {/* Question 6: Family History */}
              <div
                id="field-group-family_diabetes"
                className={cn(
                  "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                  fieldErrors.family_diabetes &&
                    "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                )}
              >
                <Label className="text-sm font-medium">
                  Have any members of your family or relatives been diagnosed with diabetes?
                </Label>
                <RadioGroup
                  value={data.family_diabetes}
                  onValueChange={(val) => updateField("family_diabetes", val)}
                  disabled={isSubmitting || isLoadingData}
                  className="flex flex-col gap-2.5 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="fd-no" />
                    <Label
                      htmlFor="fd-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="second_degree" id="fd-yes2" />
                    <Label
                      htmlFor="fd-yes2"
                      className="cursor-pointer font-normal"
                    >
                      Yes: grandparent, aunt, uncle, or first cousin
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first_degree" id="fd-yes1" />
                    <Label
                      htmlFor="fd-yes1"
                      className="cursor-pointer font-normal"
                    >
                      Yes: parent, brother, sister, or child
                    </Label>
                  </div>
                </RadioGroup>
                {fieldErrors.family_diabetes && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.family_diabetes}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Habits"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {formType === "mood" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Mood & Well-being</CardTitle>
            <CardDescription>
              Over the last two weeks, how often have you been bothered by any of the following problems?
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveMood(e)}>
            <CardContent className="space-y-4">
              {PHQ9_QUESTIONS.map(({ field, prompt }, index) => (
                <div
                  key={field}
                  id={`field-group-${field}`}
                  className={cn(
                    "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                    fieldErrors[field] &&
                      "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <Label className="text-sm font-medium">{index + 1}. {prompt}</Label>
                  <RadioGroup
                    value={data[field]}
                    onValueChange={(value) => updateField(field, value)}
                    disabled={isSubmitting || isLoadingData}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {["Not at all", "Several days", "More than half the days", "Nearly every day"].map(
                      (label, score) => (
                        <div key={label} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(score)} id={`${field}-${score}`} />
                          <Label htmlFor={`${field}-${score}`} className="cursor-pointer font-normal">
                            {label}
                          </Label>
                        </div>
                      )
                    )}
                  </RadioGroup>
                  {fieldErrors[field] && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors[field]}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Mood Assessment"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {formType === "metabolic" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Metabolic Health</CardTitle>
            <CardDescription>
              Enter your latest measurements and treatment information.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveMetabolic(e)}>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {([
                  ["triglycerides", "Triglycerides (mg/dL)"],
                  ["total_cholesterol", "Total cholesterol (mg/dL)"],
                  ["hdl_cholesterol", "HDL cholesterol (mg/dL)"],
                  ["systolic_blood_pressure", "Systolic blood pressure (mmHg)"],
                  ["diastolic_blood_pressure", "Diastolic blood pressure (mmHg)"],
                  ["fasting_glucose", "Fasting glucose (mg/dL)"],
                ] as Array<[keyof StudiesData, string]>).map(([field, label]) => (
                  <div key={field} id={`field-group-${field}`} className="space-y-2 rounded-xl border border-border/30 bg-background/40 p-4">
                    <Label htmlFor={field}>{label}</Label>
                    <Input
                      id={field}
                      type="number"
                      min="0"
                      value={data[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      disabled={isSubmitting || isLoadingData}
                    />
                    {fieldErrors[field] && <p className="text-xs font-medium text-destructive">{fieldErrors[field]}</p>}
                  </div>
                ))}
              </div>
              {/* Laboratory Study Date & Obsolescence Control */}
              <div id="field-group-lab_study_date" className="space-y-3 rounded-xl border border-border/30 bg-background/40 p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lab_study_date" className="font-medium">
                    Date of Laboratory Study (Fecha del estudio) *
                  </Label>
                  {data.lab_study_date && isLabStudyObsolete(data.lab_study_date) && (
                    <span className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3.5" /> Dato obsoleto (&gt; 12 meses)
                    </span>
                  )}
                </div>
                <Input
                  id="lab_study_date"
                  type="date"
                  value={data.lab_study_date}
                  onChange={(e) => updateField("lab_study_date", e.target.value)}
                  disabled={isSubmitting || isLoadingData}
                  className={cn(fieldErrors.lab_study_date && "border-destructive")}
                />
                {data.lab_study_date && isLabStudyObsolete(data.lab_study_date) && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    El estudio supera los 12 meses de antigüedad. Por favor, actualizá los datos con un estudio reciente.
                  </p>
                )}
                {fieldErrors.lab_study_date && <p className="text-xs font-medium text-destructive">{fieldErrors.lab_study_date}</p>}
              </div>

              {/* Glucose-lowering medication */}
              <div id="field-group-glucose_lowering_medication" className="space-y-3 rounded-xl border border-border/30 bg-background/40 p-4">
                <Label>Are you taking glucose-lowering medication?</Label>
                <RadioGroup value={data.glucose_lowering_medication} onValueChange={(value) => updateField("glucose_lowering_medication", value)} disabled={isSubmitting || isLoadingData} className="flex gap-6">
                  <div className="flex items-center gap-2"><RadioGroupItem value="true" id="metabolic-glucose-yes" /><Label htmlFor="metabolic-glucose-yes">Yes</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="false" id="metabolic-glucose-no" /><Label htmlFor="metabolic-glucose-no">No</Label></div>
                </RadioGroup>
                {fieldErrors.glucose_lowering_medication && <p className="text-xs font-medium text-destructive">{fieldErrors.glucose_lowering_medication}</p>}
              </div>

              {/* Statins (Cholesterol Medication) */}
              <div id="field-group-statins" className="space-y-3 rounded-xl border border-border/30 bg-background/40 p-4">
                <Label>Are you currently taking statins (medication for cholesterol)?</Label>
                <RadioGroup value={data.statins} onValueChange={(value) => updateField("statins", value)} disabled={isSubmitting || isLoadingData} className="flex gap-6">
                  <div className="flex items-center gap-2"><RadioGroupItem value="true" id="statins-yes" /><Label htmlFor="statins-yes">Yes</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="false" id="statins-no" /><Label htmlFor="statins-no">No</Label></div>
                </RadioGroup>
                {fieldErrors.statins && <p className="text-xs font-medium text-destructive">{fieldErrors.statins}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild><Link to="/forms">Cancel</Link></Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>{isSubmitting ? "Saving..." : "Save Metabolic Data"}</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {formType === "eoss" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Obesity-related Health Impact (EOSS)</CardTitle>
            <CardDescription>
              Choose the statement that best describes your daily situation in each area. This functional assessment is a self-evaluation, not a medical diagnosis.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveEoss(e)}>
            <CardContent className="space-y-6">
              {EOSS_SECTIONS.map((section) => (
                <div
                  key={section.field}
                  id={`field-group-${section.field}`}
                  className={cn(
                    "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                    fieldErrors[section.field] &&
                      "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <div>
                    <Label className="text-sm font-medium">{section.title}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{section.subtitle}</p>
                  </div>
                  <RadioGroup
                    value={data[section.field]}
                    onValueChange={(value) => updateField(section.field, value)}
                    disabled={isSubmitting || isLoadingData}
                    className="space-y-2.5 pt-1"
                  >
                    {section.options.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border border-border/30 bg-background/30 p-3 transition-all hover:bg-background/60",
                          data[section.field] === option.value && "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                        )}
                      >
                        <RadioGroupItem value={option.value} id={`${section.field}-${option.value}`} className="mt-1" />
                        <Label htmlFor={`${section.field}-${option.value}`} className="cursor-pointer font-normal text-sm text-foreground leading-snug">
                          {option.description}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldErrors[section.field] && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors[section.field]}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Health Impact"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {formType === "nordic_nmq" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Standardized Nordic Questionnaire (NMQ)</CardTitle>
            <CardDescription>
              Evaluate musculoskeletal trouble and work capacity across 9 body regions over the past 12 months and 7 days.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveNordicNmq(e)}>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto rounded-xl border border-border/30 bg-background/40 p-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-2">Body Region</th>
                      <th className="py-3 px-2 text-center">Trouble in last 12m?</th>
                      <th className="py-3 px-2 text-center">Prevented work in last 12m?</th>
                      <th className="py-3 px-2 text-center">Trouble in last 7 days?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {NMQ_ANATOMICAL_ZONES.map((zone) => {
                      const f12m = `nmq_${zone.id}_12m` as keyof StudiesData
                      const fPrev = `nmq_${zone.id}_prevent_12m` as keyof StudiesData
                      const f7d = `nmq_${zone.id}_7d` as keyof StudiesData
                      const hasErr = fieldErrors[f12m] || fieldErrors[fPrev] || fieldErrors[f7d]

                      return (
                        <tr key={zone.id} id={`field-group-${f12m}`} className={cn("hover:bg-muted/20 transition-colors", hasErr && "bg-destructive/10")}>
                          <td className="py-3 px-2 font-medium text-foreground">{zone.name}</td>
                          <td className="py-3 px-2 text-center">
                            <RadioGroup
                              value={data[f12m]}
                              onValueChange={(val) => updateField(f12m, val)}
                              disabled={isSubmitting || isLoadingData}
                              className="inline-flex gap-4 justify-center"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="true" id={`${f12m}-yes`} />
                                <Label htmlFor={`${f12m}-yes`} className="cursor-pointer text-xs">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="false" id={`${f12m}-no`} />
                                <Label htmlFor={`${f12m}-no`} className="cursor-pointer text-xs">No</Label>
                              </div>
                            </RadioGroup>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <RadioGroup
                              value={data[fPrev]}
                              onValueChange={(val) => updateField(fPrev, val)}
                              disabled={isSubmitting || isLoadingData}
                              className="inline-flex gap-4 justify-center"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="true" id={`${fPrev}-yes`} />
                                <Label htmlFor={`${fPrev}-yes`} className="cursor-pointer text-xs">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="false" id={`${fPrev}-no`} />
                                <Label htmlFor={`${fPrev}-no`} className="cursor-pointer text-xs">No</Label>
                              </div>
                            </RadioGroup>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <RadioGroup
                              value={data[f7d]}
                              onValueChange={(val) => updateField(f7d, val)}
                              disabled={isSubmitting || isLoadingData}
                              className="inline-flex gap-4 justify-center"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="true" id={`${f7d}-yes`} />
                                <Label htmlFor={`${f7d}-yes`} className="cursor-pointer text-xs">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="false" id={`${f7d}-no`} />
                                <Label htmlFor={`${f7d}-no`} className="cursor-pointer text-xs">No</Label>
                              </div>
                            </RadioGroup>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Ergonomics Assessment"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {formType === "audit_c" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">AUDIT-C Alcohol Risk Assessment</CardTitle>
            <CardDescription>
              WHO standardized 3-question survey evaluating alcohol consumption habits and risk patterns.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveAuditC(e)}>
            <CardContent className="space-y-6">
              {AUDIT_C_QUESTIONS.map((q) => (
                <div
                  key={q.field}
                  id={`field-group-${q.field}`}
                  className={cn(
                    "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                    fieldErrors[q.field] &&
                      "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <Label className="text-sm font-medium">{q.title}</Label>
                  <RadioGroup
                    value={data[q.field]}
                    onValueChange={(val) => updateField(q.field, val)}
                    disabled={isSubmitting || isLoadingData}
                    className="grid gap-2.5 sm:grid-cols-2"
                  >
                    {q.options.map((opt) => (
                      <div
                        key={opt.value}
                        className={cn(
                          "flex items-center space-x-2.5 rounded-lg border border-border/30 bg-background/30 p-3 transition-all hover:bg-background/60",
                          data[q.field] === opt.value && "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                        )}
                      >
                        <RadioGroupItem value={opt.value} id={`${q.field}-${opt.value}`} />
                        <Label htmlFor={`${q.field}-${opt.value}`} className="cursor-pointer text-sm font-normal">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldErrors[q.field] && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors[q.field]}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Alcohol Assessment"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {formType === "pss10" && (
        <Card className="rounded-2xl border border-border/40 bg-background/50 shadow-md backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Perceived Stress & Burnout (PSS-10)</CardTitle>
            <CardDescription>
              Read each item and indicate how often you felt or thought that way during the last month.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSavePss10(e)}>
            <CardContent className="space-y-4">
              {PSS10_QUESTIONS.map(({ field, prompt, isReversed }) => (
                <div
                  key={field}
                  id={`field-group-${field}`}
                  className={cn(
                    "space-y-3 rounded-xl border border-border/30 bg-background/40 p-4 transition-all",
                    fieldErrors[field] &&
                      "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-medium">{prompt}</Label>
                    {isReversed && (
                      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Coping Factor
                      </span>
                    )}
                  </div>
                  <RadioGroup
                    value={data[field]}
                    onValueChange={(val) => updateField(field, val)}
                    disabled={isSubmitting || isLoadingData}
                    className="grid gap-2 sm:grid-cols-5"
                  >
                    {PSS10_LIKERT_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border border-border/30 bg-background/30 p-2 text-center transition-all hover:bg-background/60",
                          data[field] === opt.value && "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                        )}
                      >
                        <RadioGroupItem value={opt.value} id={`${field}-${opt.value}`} className="mb-1" />
                        <Label htmlFor={`${field}-${opt.value}`} className="cursor-pointer text-xs font-normal">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldErrors[field] && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors[field]}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
              <Button variant="ghost" asChild>
                <Link to="/forms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? "Saving..." : "Save Perceived Stress Scale"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}

