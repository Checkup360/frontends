import { formatEnumLabel } from "@workspace/ui/lib/format-enum-label"
import { useMemo, useState } from "react"
import type {
  AssessmentSubmissionDetail,
  AssessmentSubmissionSummary,
} from "@workspace/api"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { getAssessmentDisplayName } from "./assessment-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { TablePagination } from "./table-pagination"

interface AssessmentSubmissionHistoryProps {
  submissions: AssessmentSubmissionSummary[]
  loading: boolean
  onSelect: (submission: AssessmentSubmissionSummary) => void
  selected: AssessmentSubmissionDetail | null
  detailLoading: boolean
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function SubmissionStatusBadge({ status }: { status: string }) {
  const lower = (status || "").toLowerCase()
  if (lower === "completed") {
    return null
  }
  if (lower === "submitted") {
    return (
      <Badge
        variant="info-light"
        size="sm"
        className="gap-1 border-blue-500/20 font-medium"
      >
        <CheckCircle2 className="size-3" />
        Submitted
      </Badge>
    )
  }
  if (lower === "pending" || lower === "in_progress") {
    return (
      <Badge
        variant="warning-light"
        size="sm"
        className="gap-1 border-amber-500/20 font-medium"
      >
        <Clock className="size-3" />
        Pending
      </Badge>
    )
  }
  return (
    <Badge variant="outline" size="sm" className="font-medium">
      {formatEnumLabel(status)}
    </Badge>
  )
}

function ScoreRiskBadge({
  riskLevel,
  healthIndex,
}: {
  riskLevel: string | null | undefined
  healthIndex?: number | null
}) {
  const normalized = (riskLevel || "").toLowerCase().replace(/_/g, " ")
  const score = typeof healthIndex === "number" ? Math.round(healthIndex) : null

  if (
    normalized.includes("high") ||
    normalized.includes("attention") ||
    normalized.includes("severe") ||
    normalized.includes("critical")
  ) {
    return (
      <Badge variant="risk-high" size="sm" className="gap-1 font-semibold">
        <AlertCircle className="size-3" />
        {normalized.includes("very high") ? "Very high risk" : "High risk"}
      </Badge>
    )
  }

  if (
    normalized.includes("mod") ||
    normalized.includes("elevated") ||
    normalized.includes("mild") ||
    normalized.includes("medium")
  ) {
    return (
      <Badge variant="risk-moderate" size="sm" className="gap-1 font-semibold">
        <AlertTriangle className="size-3" />
        Moderate risk
      </Badge>
    )
  }

  if (
    normalized.includes("low") ||
    normalized.includes("optimal") ||
    normalized.includes("good") ||
    normalized.includes("normal")
  ) {
    return (
      <Badge variant="risk-low" size="sm" className="gap-1 font-semibold">
        <CheckCircle2 className="size-3" />
        Low risk
      </Badge>
    )
  }

  if (normalized.includes("completed")) {
    return (
      <Badge variant="success-light" size="sm" className="gap-1 font-semibold">
        <CheckCircle2 className="size-3" />
        Completed
      </Badge>
    )
  }

  if (score !== null) {
    if (score >= 80) {
      return (
        <Badge variant="risk-low" size="sm" className="gap-1 font-semibold">
          <CheckCircle2 className="size-3" />
          Low risk
        </Badge>
      )
    }
    if (score >= 50) {
      return (
        <Badge variant="risk-moderate" size="sm" className="gap-1 font-semibold">
          <AlertTriangle className="size-3" />
          Moderate risk
        </Badge>
      )
    }
    return (
      <Badge variant="risk-high" size="sm" className="gap-1 font-semibold">
        <AlertCircle className="size-3" />
        High risk
      </Badge>
    )
  }

  return (
    <Badge variant="info-light" size="sm" className="gap-1 font-medium">
      {riskLevel ? formatEnumLabel(riskLevel) : "Calculated"}
    </Badge>
  )
}

const FORM_FIELDS: Record<string, string[]> = {
  biometrics: [
    "sex",
    "height",
    "weight",
    "waist_circumference",
    "neck_circumference",
  ],
  sleep: ["snoring", "tired", "observed_apnea", "neck_circumference"],
  habits: [
    "daily_physical_activity",
    "fruits_vegetables",
    "hypertension_medication",
    "previous_high_glucose",
    "smoker",
    "family_diabetes",
  ],
  mood: [
    "little_interest",
    "feeling_down",
    "sleep_trouble",
    "tired_energy",
    "appetite",
    "feeling_bad",
    "concentration",
    "psychomotor",
    "self_harm_thoughts",
  ],
  metabolic: [
    "triglycerides",
    "total_cholesterol",
    "hdl_cholesterol",
    "systolic_blood_pressure",
    "diastolic_blood_pressure",
    "fasting_glucose",
    "glucose_lowering_medication",
  ],
  eoss: [
    "eoss_physical_health_stage",
    "eoss_mental_health_stage",
    "eoss_functional_stage",
  ],
  audit_c: [
    "audit_c_frequency",
    "audit_c_quantity",
    "audit_c_heavy_drinking",
  ],
  pss10: [
    "pss10_q1",
    "pss10_q2",
    "pss10_q3",
    "pss10_q4",
    "pss10_q5",
    "pss10_q6",
    "pss10_q7",
    "pss10_q8",
    "pss10_q9",
    "pss10_q10",
  ],
  nordic_nmq: ["nordic_nmq_data"],
}

const NMQ_ZONE_LABELS: Record<string, string> = {
  neck: "Neck",
  shoulders: "Shoulders",
  elbows: "Elbows",
  wrists_hands: "Wrists & Hands",
  upper_back: "Upper Back",
  lower_back: "Lower Back",
  hips_thighs: "Hips & Thighs",
  knees: "Knees",
  ankles_feet: "Ankles & Feet",
}

const FORM_LABELS: Record<string, string> = {
  biometrics: "Physical Biometrics",
  sleep: "Sleep Quality",
  habits: "Lifestyle & Habits",
  mood: "Mood & Well-being",
  metabolic: "Metabolic Health",
  eoss: "Obesity Impact",
  audit_c: "Alcohol Habits",
  pss10: "Stress & Burnout",
  nordic_nmq: "Musculoskeletal",
  clinical_assessment: "Clinical Assessment",
  eoss_physical_health_stage: "Physical health stage",
  eoss_mental_health_stage: "Mental health stage",
  eoss_functional_stage: "Functional daily living stage",
  sex: "Biological sex",
  height: "Height (cm)",
  weight: "Weight (kg)",
  waist_circumference: "Waist circumference (cm)",
  triglycerides: "Triglycerides (mg/dL)",
  total_cholesterol: "Total cholesterol (mg/dL)",
  hdl_cholesterol: "HDL cholesterol (mg/dL)",
  systolic_blood_pressure: "Systolic blood pressure (mmHg)",
  diastolic_blood_pressure: "Diastolic blood pressure (mmHg)",
  fasting_glucose: "Fasting blood glucose (mg/dL)",
  glucose_lowering_medication: "Glucose-lowering medication",
  neck_circumference: "Neck circumference (cm)",
  snoring: "Snoring",
  tired: "Daytime fatigue",
  observed_apnea: "Observed apnea",
  daily_physical_activity: "Daily physical activity (30+ min)",
  fruits_vegetables: "Daily fruit & vegetables intake",
  hypertension_medication: "Blood pressure medication",
  previous_high_glucose: "Previous high blood glucose",
  smoker: "Current smoking status",
  family_diabetes: "Family history of diabetes",
  little_interest: "1. Little interest or pleasure in doing things",
  feeling_down: "2. Feeling down, depressed, or hopeless",
  sleep_trouble: "3. Trouble falling/staying asleep, or sleeping too much",
  tired_energy: "4. Feeling tired or having little energy",
  appetite: "5. Poor appetite or overeating",
  feeling_bad: "6. Feeling bad about yourself",
  concentration: "7. Trouble concentrating on things",
  psychomotor: "8. Moving/speaking slowly or being restless",
  self_harm_thoughts: "9. Thoughts of self-harm or being better off dead",
  audit_c_frequency: "1. How often do you have a drink containing alcohol?",
  audit_c_quantity: "2. How many standard drinks on a typical drinking day?",
  audit_c_heavy_drinking: "3. How often do you have 6+ drinks on one occasion?",
  pss10_q1: "1. Upset because of something that happened unexpectedly",
  pss10_q2: "2. Felt unable to control important things in your life",
  pss10_q3: "3. Felt nervous and stressed",
  pss10_q4: "4. Felt confident about ability to handle personal problems",
  pss10_q5: "5. Felt that things were going your way",
  pss10_q6: "6. Found that you could not cope with all things to do",
  pss10_q7: "7. Able to control irritations in your life",
  pss10_q8: "8. Felt that you were on top of things",
  pss10_q9: "9. Angered because of things outside your control",
  pss10_q10: "10. Difficulties piling up so high you could not overcome them",
}

function getFormLabel(value: string): string {
  return FORM_LABELS[value] || formatEnumLabel(value)
}

function formatAnswer(field: string, value: unknown): string {
  if (value === null || value === undefined) return "Not provided"
  if (typeof value === "boolean") return value ? "Yes" : "No"

  if (field === "family_diabetes") {
    return (
      {
        no: "No family history",
        second_degree: "Yes, second-degree relative (grandparent, aunt, etc.)",
        first_degree: "Yes, first-degree relative (parent, sibling, child)",
        yes_2nd_degree: "Yes, second-degree relative",
        yes_1st_degree: "Yes, first-degree relative",
      }[String(value)] || String(value)
    )
  }

  if (field === "sex") {
    if (value === "M" || value === "male") return "Male"
    if (value === "F" || value === "female") return "Female"
  }

  if (field.startsWith("eoss_")) {
    const num = Number(value)
    return (
      {
        0: "Stage 0 (No risk factors / normal)",
        1: "Stage 1 (Subclinical risk factors)",
        2: "Stage 2 (Established comorbidities)",
        3: "Stage 3 (Significant end-organ damage)",
        4: "Stage 4 (Severe disability / end-stage)",
      }[num] || `Stage ${num}`
    )
  }

  if (
    [
      "little_interest",
      "feeling_down",
      "sleep_trouble",
      "tired_energy",
      "appetite",
      "feeling_bad",
      "concentration",
      "psychomotor",
      "self_harm_thoughts",
    ].includes(field)
  ) {
    const num = Number(value)
    return (
      {
        0: "0 - Not at all",
        1: "1 - Several days",
        2: "2 - More than half the days",
        3: "3 - Nearly every day",
      }[num] || String(value)
    )
  }

  if (field === "audit_c_frequency") {
    const num = Number(value)
    return (
      {
        0: "Never",
        1: "Monthly or less",
        2: "2 to 4 times a month",
        3: "2 to 3 times a week",
        4: "4 or more times a week",
      }[num] || String(value)
    )
  }

  if (field === "audit_c_quantity") {
    const num = Number(value)
    return (
      {
        0: "1 or 2 standard drinks",
        1: "3 or 4 standard drinks",
        2: "5 or 6 standard drinks",
        3: "7 to 9 standard drinks",
        4: "10 or more standard drinks",
      }[num] || String(value)
    )
  }

  if (field === "audit_c_heavy_drinking") {
    const num = Number(value)
    return (
      {
        0: "Never",
        1: "Less than monthly",
        2: "Monthly",
        3: "Weekly",
        4: "Daily or almost daily",
      }[num] || String(value)
    )
  }

  if (field.startsWith("pss10_q")) {
    const num = Number(value)
    return (
      {
        0: "0 - Never",
        1: "1 - Almost never",
        2: "2 - Sometimes",
        3: "3 - Fairly often",
        4: "4 - Very often",
      }[num] || String(value)
    )
  }

  return String(value)
}

function getVisibleAnswers(detail: AssessmentSubmissionDetail) {
  const fields = FORM_FIELDS[detail.form_type] || Object.keys(detail.answers)
  return fields
    .map((field) => [field, detail.answers[field]] as const)
    .filter(([, value]) => value !== null && value !== undefined)
}

export function AssessmentSubmissionHistory({
  submissions,
  loading,
  onSelect,
  selected,
  detailLoading,
}: AssessmentSubmissionHistoryProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formTypeFilter, setFormTypeFilter] = useState("all")
  const [page, setPage] = useState(1)

  const formTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(submissions.map((submission) => submission.form_type))
    )
    return types.sort((a, b) => getFormLabel(a).localeCompare(getFormLabel(b)))
  }, [submissions])

  const filteredSubmissions = useMemo(
    () =>
      formTypeFilter === "all"
        ? submissions
        : submissions.filter(
            (submission) => submission.form_type === formTypeFilter
          ),
    [submissions, formTypeFilter]
  )

  const pageSize = 10
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / pageSize)
  )
  const currentPage = Math.min(page, totalPages)
  const visibleSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSelect = (submission: AssessmentSubmissionSummary) => {
    setIsDetailOpen(true)
    onSelect(submission)
  }

  const isNmq =
    selected?.form_type === "nordic_nmq" ||
    Boolean(selected?.answers?.nordic_nmq_data)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-primary" />
          Submitted forms
        </CardTitle>
        {!loading && submissions.length > 0 && (
          <Select
            value={formTypeFilter}
            onValueChange={(value) => {
              setFormTypeFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[190px] bg-background">
              <SelectValue placeholder="All form types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All form types</SelectItem>
              {formTypeOptions.map((formType) => (
                <SelectItem key={formType} value={formType}>
                  {getFormLabel(formType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && submissions.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No submitted forms yet.</p>
        ) : filteredSubmissions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No submitted forms of this type.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {visibleSubmissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => handleSelect(submission)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {getFormLabel(submission.form_type)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(submission.submitted_at)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <SubmissionStatusBadge status={submission.status} />
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </span>
                </button>
              ))}
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSubmissions.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="submitted forms"
              loading={loading}
              className="mt-1"
            />
          </>
        )}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            {selected && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between gap-3 pr-6">
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                      {getFormLabel(selected.form_type)}
                    </DialogTitle>
                    <SubmissionStatusBadge status={selected.status} />
                  </div>
                  <DialogDescription className="text-xs">
                    {formatDate(selected.submitted_at)} · version {selected.form_version}
                  </DialogDescription>
                </DialogHeader>
                {detailLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading details...
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Questionnaire Answers Display */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                        Submitted Questionnaire Responses
                      </h4>

                      {isNmq ? (
                        <div className="rounded-xl border overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-muted/60 text-[11px] text-muted-foreground uppercase border-b">
                              <tr>
                                <th className="py-2.5 px-3 font-semibold">Anatomical Region</th>
                                <th className="py-2.5 px-2 text-center font-semibold">12m Trouble</th>
                                <th className="py-2.5 px-2 text-center font-semibold">Work Impact</th>
                                <th className="py-2.5 px-2 text-center font-semibold">7d Trouble</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {Object.entries(NMQ_ZONE_LABELS).map(([zoneKey, zoneLabel]) => {
                                const zoneData =
                                  ((selected.answers.nordic_nmq_data as Record<string, any>)?.[zoneKey]) || {}
                                const hasTrouble12m = Boolean(zoneData.trouble_last_12_months)
                                const hasPreventWork = Boolean(zoneData.prevented_work_last_12_months)
                                const hasTrouble7d = Boolean(zoneData.trouble_last_7_days)
                                const hasAny = hasTrouble12m || hasPreventWork || hasTrouble7d

                                return (
                                  <tr key={zoneKey} className={hasAny ? "bg-muted/20" : ""}>
                                    <td className="py-2 px-3 font-medium text-foreground">
                                      {zoneLabel}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      {hasTrouble12m ? (
                                        <Badge variant="warning-light" size="xs">Yes</Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-[11px]">No</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      {hasPreventWork ? (
                                        <Badge variant="destructive" size="xs">Yes</Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-[11px]">No</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      {hasTrouble7d ? (
                                        <Badge variant="warning-light" size="xs">Yes</Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-[11px]">No</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {getVisibleAnswers(selected).map(([field, value]) => (
                            <div
                              key={field}
                              className="flex flex-col justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 transition-all hover:bg-muted/30"
                            >
                              <p className="text-[11px] font-medium text-muted-foreground leading-snug">
                                {getFormLabel(field)}
                              </p>
                              <p className="text-xs font-semibold text-foreground mt-1.5">
                                {formatAnswer(field, value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resulting Evaluated Scores */}
                    {selected.scores && selected.scores.length > 0 && (
                      <div className="space-y-2.5 pt-3 border-t">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Calculated Clinical Risk Results
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selected.scores.map((score) => (
                            <div
                              key={score.score_id}
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="block truncate text-xs font-semibold text-foreground">
                                  {getAssessmentDisplayName(score.score_id, score.score_name)}
                                </span>
                                {score.health_index !== null && score.health_index !== undefined && (
                                  <span className="text-[11px] text-muted-foreground">
                                    Score: {Math.round(score.health_index)}%
                                  </span>
                                )}
                              </div>
                              <ScoreRiskBadge
                                riskLevel={score.risk_level}
                                healthIndex={score.health_index}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
