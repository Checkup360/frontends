import { useState } from "react"
import type {
  AssessmentSubmissionDetail,
  AssessmentSubmissionSummary,
} from "@workspace/api"
import { ChevronRight, ClipboardList, Loader2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { getAssessmentDisplayName } from "./assessment-utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

interface AssessmentSubmissionHistoryProps {
  submissions: AssessmentSubmissionSummary[]
  loading: boolean
  hasNext: boolean
  onLoadMore: () => void
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
    "hdl_cholesterol",
    "systolic_blood_pressure",
    "diastolic_blood_pressure",
    "fasting_glucose",
    "glucose_lowering_medication",
  ],
}

const FORM_LABELS: Record<string, string> = {
  biometrics: "Physical biometrics",
  sleep: "Sleep quality",
  habits: "Lifestyle and habits",
  mood: "Mood and emotional well-being",
  metabolic: "Metabolic health",
  clinical_assessment: "Clinical assessment",
  sex: "Biological sex",
  height: "Height",
  weight: "Weight",
  waist_circumference: "Waist circumference",
  triglycerides: "Triglycerides",
  hdl_cholesterol: "HDL cholesterol",
  systolic_blood_pressure: "Systolic blood pressure",
  diastolic_blood_pressure: "Diastolic blood pressure",
  fasting_glucose: "Fasting glucose",
  glucose_lowering_medication: "Glucose-lowering medication",
  neck_circumference: "Neck circumference",
  snoring: "Snoring",
  tired: "Daytime fatigue",
  observed_apnea: "Observed apnea",
  daily_physical_activity: "Daily physical activity",
  fruits_vegetables: "Fruit and vegetable intake",
  hypertension_medication: "Blood pressure medication",
  previous_high_glucose: "Previous high blood glucose",
  family_diabetes: "Family history of diabetes",
  little_interest: "Interest or pleasure",
  feeling_down: "Feeling down or hopeless",
  sleep_trouble: "Sleep trouble",
  tired_energy: "Energy level",
  appetite: "Appetite",
  feeling_bad: "Feeling bad about yourself",
  concentration: "Concentration",
  psychomotor: "Movement or restlessness",
  self_harm_thoughts: "Thoughts of self-harm",
}

function getFormLabel(value: string): string {
  return FORM_LABELS[value] || value.replaceAll("_", " ")
}

function formatAnswer(field: string, value: string | number | boolean | null): string {
  if (value === null) return "Not provided"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (field === "family_diabetes") {
    return {
      no: "No family history",
      yes_2nd_degree: "Yes, second-degree relative",
      yes_1st_degree: "Yes, first-degree relative",
    }[String(value)] || String(value)
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
  hasNext,
  onLoadMore,
  onSelect,
  selected,
  detailLoading,
}: AssessmentSubmissionHistoryProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleSelect = (submission: AssessmentSubmissionSummary) => {
    setIsDetailOpen(true)
    onSelect(submission)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-primary" />
          Submitted forms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && submissions.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No submitted forms yet.</p>
        ) : (
          <>
            <div className="space-y-2">
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => handleSelect(submission)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40"
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
                    <Badge variant="outline">{submission.status}</Badge>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </span>
                </button>
              ))}
            </div>
            {hasNext && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Load more
              </Button>
            )}
          </>
        )}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>{getFormLabel(selected.form_type)}</DialogTitle>
                  <DialogDescription>
                    {formatDate(selected.submitted_at)} · version {selected.form_version}
                  </DialogDescription>
                </DialogHeader>
                {detailLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading details...
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {getVisibleAnswers(selected).map(([field, value]) => (
                        <div key={field} className="rounded-md bg-muted/40 px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">{getFormLabel(field)}</p>
                          <p className="text-sm font-medium">{formatAnswer(field, value)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Risk results</h3>
                      {selected.scores.map((score) => (
                        <div key={score.score_id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <span className="text-sm">{getAssessmentDisplayName(score.score_id, score.score_name)}</span>
                          <Badge variant="outline">{score.risk_level || "Calculated"}</Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
