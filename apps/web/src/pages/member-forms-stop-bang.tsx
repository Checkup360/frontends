import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { submitStopBangAssessment } from "@workspace/api"

type StopBangData = {
  snoring: string
  tired: string
  observed_apnea: string
  hypertension_medication: string
  weight: string
  height: string
  neck_circumference: string
  sex: string
}

type AssessmentResult = {
  score_name: string
  risk_level: string
  explanation: string
}

const initialData: StopBangData = {
  snoring: "",
  tired: "",
  observed_apnea: "",
  hypertension_medication: "",
  weight: "",
  height: "",
  neck_circumference: "",
  sex: "",
}

export function MemberFormsStopBangPage() {
  const [data, setData] = useState<StopBangData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AssessmentResult | null>(null)

  const updateField = <K extends keyof StopBangData>(
    field: K,
    value: StopBangData[K]
  ) => {
    setData((current) => ({ ...current, [field]: value }))
    if (error === field) {
      setError(null)
    }
  }

  const validateForm = () => {
    if (!data.snoring) return "snoring"
    if (!data.tired) return "tired"
    if (!data.observed_apnea) return "observed_apnea"
    if (!data.hypertension_medication) return "hypertension_medication"
    if (!data.weight || isNaN(Number(data.weight))) return "weight"
    if (!data.height || isNaN(Number(data.height))) return "height"
    if (!data.neck_circumference || isNaN(Number(data.neck_circumference)))
      return "neck_circumference"
    if (!data.sex) return "sex"
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const invalidField = validateForm()
    if (invalidField) {
      setError(invalidField)
      return
    }

    setIsSubmitting(true)

    const payload = {
      height: Number(data.height),
      weight: Number(data.weight),
      neck_circumference: Number(data.neck_circumference),
      sex: data.sex,
      snoring: data.snoring === "true",
      tired: data.tired === "true",
      observed_apnea: data.observed_apnea === "true",
      hypertension_medication: data.hypertension_medication === "true",
    }

    const response = await submitStopBangAssessment(payload)
    setIsSubmitting(false)

    if (response.error) {
      setError(response.error.message || "An error occurred")
      return
    }

    const scoreResult = response.success.results[0]
    setResult({
      score_name: scoreResult.score_name,
      risk_level: scoreResult.risk_level || "Unknown",
      explanation: scoreResult.explanation || "No explanation provided.",
    })
  }

  const fieldError = (fieldError: string | null, field: string) => {
    return fieldError === field ? (
      <p className="mt-1 text-sm text-destructive">This field is required</p>
    ) : null
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            Assessment Complete
          </h2>
        </div>

        <Card className="border-[color:var(--success)]/30">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--success)]/10">
              <CheckCircle2 className="h-6 w-6 text-[color:var(--success)]" />
            </div>
            <CardTitle>Results Saved Successfully</CardTitle>
            <CardDescription>
              Your Stop-Bang risk score has been evaluated.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-center">
            <div className="rounded-lg bg-muted/50 p-6">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Risk Level
              </p>
              <p className="text-2xl font-bold text-foreground">
                {result.risk_level}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {result.explanation}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button asChild>
              <Link to="/forms">Return to Forms</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Stop-Bang Assessment
          </h2>
          <p className="text-sm text-muted-foreground">
            Please answer the following questions to assess your risk for sleep
            apnea.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Health Information</CardTitle>
            </div>
            <CardDescription>
              Your physiological data is required to calculate the score
              accurately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g. 175"
                  value={data.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  disabled={isSubmitting}
                />
                {fieldError(error, "height")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g. 70"
                  value={data.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  disabled={isSubmitting}
                />
                {fieldError(error, "weight")}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="neck_circumference">
                  Neck Circumference (cm)
                </Label>
                <Input
                  id="neck_circumference"
                  type="number"
                  placeholder="e.g. 40"
                  value={data.neck_circumference}
                  onChange={(e) =>
                    updateField("neck_circumference", e.target.value)
                  }
                  disabled={isSubmitting}
                />
                {fieldError(error, "neck_circumference")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Biological Sex</Label>
                <Select
                  value={data.sex}
                  onValueChange={(val) => updateField("sex", val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {fieldError(error, "sex")}
              </div>
            </div>

            <Separator />

            <div className="space-y-4 pt-2">
              <div className="mb-4 flex items-center gap-2">
                <CardTitle className="text-lg">Questionnaire</CardTitle>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-normal">
                  S - Do you snore loudly (louder than talking or loud enough to
                  be heard through closed doors)?
                </Label>
                <RadioGroup
                  value={data.snoring}
                  onValueChange={(val) => updateField("snoring", val)}
                  disabled={isSubmitting}
                  className="flex flex-row gap-4"
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
                {fieldError(error, "snoring")}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <Label className="text-base font-normal">
                  T - Do you often feel tired, fatigued, or sleepy during
                  daytime?
                </Label>
                <RadioGroup
                  value={data.tired}
                  onValueChange={(val) => updateField("tired", val)}
                  disabled={isSubmitting}
                  className="flex flex-row gap-4"
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
                {fieldError(error, "tired")}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <Label className="text-base font-normal">
                  O - Has anyone observed you stop breathing during your sleep?
                </Label>
                <RadioGroup
                  value={data.observed_apnea}
                  onValueChange={(val) => updateField("observed_apnea", val)}
                  disabled={isSubmitting}
                  className="flex flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="observed_apnea-yes" />
                    <Label
                      htmlFor="observed_apnea-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="observed_apnea-no" />
                    <Label
                      htmlFor="observed_apnea-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldError(error, "observed_apnea")}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <Label className="text-base font-normal">
                  P - Do you have or are you being treated for high blood
                  pressure?
                </Label>
                <RadioGroup
                  value={data.hypertension_medication}
                  onValueChange={(val) =>
                    updateField("hypertension_medication", val)
                  }
                  disabled={isSubmitting}
                  className="flex flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="bp-yes" />
                    <Label
                      htmlFor="bp-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="bp-no" />
                    <Label
                      htmlFor="bp-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {fieldError(error, "hypertension_medication")}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto w-full sm:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
