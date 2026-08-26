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

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"
import { ArrowLeft, CheckCircle2, FileText, Info, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { submitClinicalAssessment, fetchMemberProfile, fetchMemberBiometrics } from "@workspace/api"

type StudiesData = {
  snoring: string
  tired: string
  observed_apnea: string
  hypertension_medication: string
  weight: string
  height: string
  neck_circumference: string
  sex: string
  age: string
  waist_circumference: string
  daily_physical_activity: string
  fruits_vegetables: string
  previous_high_glucose: string
  family_diabetes: string
}

type AssessmentResult = {
  score_name: string
  risk_level: string
  explanation: string
}

const initialData: StudiesData = {
  snoring: "",
  tired: "",
  observed_apnea: "",
  hypertension_medication: "",
  weight: "",
  height: "",
  neck_circumference: "",
  sex: "",
  age: "",
  waist_circumference: "",
  daily_physical_activity: "",
  fruits_vegetables: "",
  previous_high_glucose: "",
  family_diabetes: "",
}

export function MemberFormsStudiesPage() {
  const [data, setData] = useState<StudiesData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null)
  const [results, setResults] = useState<AssessmentResult[]>([])

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setIsLoadingData(true)
      const [profile, biometrics] = await Promise.all([
        fetchMemberProfile(),
        fetchMemberBiometrics()
      ])

      if (!cancelled) {
        if (profile && profile.date_of_birth) {
          const birthDate = new Date(profile.date_of_birth)
          const today = new Date()
          let calculatedAge = today.getFullYear() - birthDate.getFullYear()
          const m = today.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--
          }
          if (!isNaN(calculatedAge) && calculatedAge > 0) {
            setData(d => ({ ...d, age: calculatedAge.toString() }))
          }
        }
        
        if (biometrics) {
          setData(d => ({
            ...d,
            sex: biometrics.biological_sex || "",
            height: biometrics.height ? biometrics.height.toString() : "",
            weight: biometrics.weight ? biometrics.weight.toString() : ""
          }))
        }
        setIsLoadingData(false)
      }
    }
    void loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const updateField = <K extends keyof StudiesData>(
    field: K,
    value: StudiesData[K]
  ) => {
    setData((current) => ({ ...current, [field]: value }))
    if (error === field) {
      setError(null)
    }
    setSubmitErrorMessage(null)
  }

  const isMissingProfileData = !isLoadingData && (!data.height || !data.weight || !data.sex || !data.age)

  const validateForm = () => {
    if (!data.height || isNaN(Number(data.height)) || !data.weight || isNaN(Number(data.weight)) || !data.sex || !data.age || isNaN(Number(data.age))) {
      return "missing_profile_data"
    }
    if (!data.neck_circumference || isNaN(Number(data.neck_circumference))) return "neck_circumference"
    if (!data.waist_circumference || isNaN(Number(data.waist_circumference))) return "waist_circumference"
    if (!data.snoring) return "snoring"
    if (!data.tired) return "tired"
    if (!data.observed_apnea) return "observed_apnea"
    if (!data.hypertension_medication) return "hypertension_medication"
    if (!data.daily_physical_activity) return "daily_physical_activity"
    if (!data.fruits_vegetables) return "fruits_vegetables"
    if (!data.previous_high_glucose) return "previous_high_glucose"
    if (!data.family_diabetes) return "family_diabetes"
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitErrorMessage(null)

    const invalidField = validateForm()
    if (invalidField) {
      setError(invalidField)
      if (invalidField === "missing_profile_data") {
        setSubmitErrorMessage("Your physical profile data (height, weight, biological sex, or date of birth) is incomplete. Please complete your profile in Settings before submitting.")
      }
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
      age: Number(data.age),
      waist_circumference: Number(data.waist_circumference),
      daily_physical_activity: data.daily_physical_activity === "true",
      fruits_vegetables: data.fruits_vegetables === "true",
      previous_high_glucose: data.previous_high_glucose === "true",
      family_diabetes: data.family_diabetes,
    }

    const response = await submitClinicalAssessment(payload)
    setIsSubmitting(false)

    if (response.error) {
      const msg = response.error.message || "An error occurred"
      const lowerMsg = msg.toLowerCase()
      if (lowerMsg.includes("detail") || lowerMsg.includes("onboarding") || lowerMsg.includes("profile") || lowerMsg.includes("not found")) {
        setSubmitErrorMessage("Your basic physical profile is incomplete in our records. Please complete your date of birth, height, weight, and biological sex in Settings before submitting.")
      } else {
        setSubmitErrorMessage(msg)
      }
      return
    }

    const mappedResults = response.success.results.map((res) => ({
      score_name: res.score_name,
      risk_level: res.risk_level || "Unknown",
      explanation: res.explanation || "No explanation provided.",
    }))
    setResults(mappedResults)
  }

  const fieldError = (fieldError: string | null, field: string) => {
    return fieldError === field ? (
      <p className="mt-1 text-sm text-destructive">This field is required</p>
    ) : null
  }

  if (results.length > 0) {
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
              Your health assessments have been evaluated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-center">
            {results.map((res, index) => (
              <div key={index} className="rounded-lg bg-muted/50 p-6">
                <p className="mb-2 text-lg font-semibold text-foreground">
                  {res.score_name}
                </p>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Risk Level
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {res.risk_level}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {res.explanation}
                </p>
              </div>
            ))}
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
            Clinical Studies Form
          </h2>
          <p className="text-sm text-muted-foreground">
            Please complete the following information.
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
              Please complete the following information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="info" className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Using your profile biometrics</AlertTitle>
              <AlertDescription>
                <p>
                  We're securely auto-filling this assessment using the biological data (like height and weight) from your health profile. If any information is out of date, please visit the{" "}
                  <Link to="/settings" className="font-semibold underline">Settings</Link>{" "}
                  to update it before submitting.
                </p>
              </AlertDescription>
            </Alert>

            {isMissingProfileData && (
              <Alert variant="info" className="mb-6 border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>Incomplete Physical Profile</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Some of your basic physical data (height, weight, biological sex, or date of birth) is missing from your profile. You must complete your physical profile before submitting this form.
                  </p>
                  <Button variant="outline" size="sm" asChild className="bg-background text-foreground hover:bg-muted">
                    <Link to="/settings" className="font-semibold">
                      Go to Settings to complete profile
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {submitErrorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cannot Submit Assessment</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{submitErrorMessage}</p>
                  <Button variant="outline" size="sm" asChild className="bg-background text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Link to="/settings" className="font-semibold">
                      Go to Settings to complete profile
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {isLoadingData ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 rounded-md bg-muted" />
                <div className="h-10 rounded-md bg-muted" />
              </div>
            ) : (
              <>
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
                    <Label htmlFor="waist_circumference">
                      Waist Circumference (cm)
                    </Label>
                    <Input
                      id="waist_circumference"
                      type="number"
                      placeholder="e.g. 90"
                      value={data.waist_circumference}
                      onChange={(e) =>
                        updateField("waist_circumference", e.target.value)
                      }
                      disabled={isSubmitting}
                    />
                    {fieldError(error, "waist_circumference")}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      Do you snore loudly (loud enough to be heard through closed doors or your partner elbows you for snoring at night)?
                    </Label>
                    <RadioGroup
                      value={data.snoring}
                      onValueChange={(val) => updateField("snoring", val)}
                      disabled={isSubmitting}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="snoring-yes" />
                        <Label htmlFor="snoring-yes" className="cursor-pointer font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="snoring-no" />
                        <Label htmlFor="snoring-no" className="cursor-pointer font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "snoring")}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      Do you often feel tired, fatigued, or sleepy during daytime (such as falling asleep during driving or talking to someone)?
                    </Label>
                    <RadioGroup
                      value={data.tired}
                      onValueChange={(val) => updateField("tired", val)}
                      disabled={isSubmitting}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="tired-yes" />
                        <Label htmlFor="tired-yes" className="cursor-pointer font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="tired-no" />
                        <Label htmlFor="tired-no" className="cursor-pointer font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "tired")}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      Has anyone observed you stop breathing, choking or gasping during your sleep?
                    </Label>
                    <RadioGroup
                      value={data.observed_apnea}
                      onValueChange={(val) =>
                        updateField("observed_apnea", val)
                      }
                      disabled={isSubmitting}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="apnea-yes" />
                        <Label htmlFor="apnea-yes" className="cursor-pointer font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="apnea-no" />
                        <Label htmlFor="apnea-no" className="cursor-pointer font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "observed_apnea")}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      Are you currently taking medication for high blood pressure?
                    </Label>
                    <RadioGroup
                      value={data.hypertension_medication}
                      onValueChange={(val) =>
                        updateField("hypertension_medication", val)
                      }
                      disabled={isSubmitting}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="hyp-yes" />
                        <Label htmlFor="hyp-yes" className="cursor-pointer font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="hyp-no" />
                        <Label htmlFor="hyp-no" className="cursor-pointer font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "hypertension_medication")}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      Do you do at least 30 minutes of physical activity every day at work or during leisure time (including normal daily activity)?
                    </Label>
                    <RadioGroup
                      value={data.daily_physical_activity}
                      onValueChange={(val) =>
                        updateField("daily_physical_activity", val)
                      }
                      disabled={isSubmitting}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="pa-yes" />
                        <Label htmlFor="pa-yes" className="cursor-pointer font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="pa-no" />
                        <Label htmlFor="pa-no" className="cursor-pointer font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "daily_physical_activity")}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      How often do you eat vegetables, fruit, or berries?
                    </Label>
                    <RadioGroup
                      value={data.fruits_vegetables}
                      onValueChange={(val) =>
                        updateField("fruits_vegetables", val)
                      }
                      disabled={isSubmitting}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="fv-everyday" />
                        <Label htmlFor="fv-everyday" className="cursor-pointer font-normal">
                          Every day
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="fv-not-everyday" />
                        <Label htmlFor="fv-not-everyday" className="cursor-pointer font-normal">
                          Not every day
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "fruits_vegetables")}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      Have you ever been found to have high blood glucose (e.g. in a health examination, during an illness, or during pregnancy)?
                    </Label>
                    <RadioGroup
                      value={data.previous_high_glucose}
                      onValueChange={(val) =>
                        updateField("previous_high_glucose", val)
                      }
                      disabled={isSubmitting}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="hg-yes" />
                        <Label htmlFor="hg-yes" className="cursor-pointer font-normal">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="hg-no" />
                        <Label htmlFor="hg-no" className="cursor-pointer font-normal">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "previous_high_glucose")}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-base font-normal">
                      Have any of the members of your immediate family or other relatives been diagnosed with diabetes?
                    </Label>
                    <RadioGroup
                      value={data.family_diabetes}
                      onValueChange={(val) =>
                        updateField("family_diabetes", val)
                      }
                      disabled={isSubmitting}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="fd-no" />
                        <Label htmlFor="fd-no" className="cursor-pointer font-normal">
                          No
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes_2nd_degree" id="fd-yes2" />
                        <Label htmlFor="fd-yes2" className="cursor-pointer font-normal">
                          Yes: grandparent, aunt, uncle, or first cousin (but no own parent, brother, sister or child)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes_1st_degree" id="fd-yes1" />
                        <Label htmlFor="fd-yes1" className="cursor-pointer font-normal">
                          Yes: parent, brother, sister, or own child
                        </Label>
                      </div>
                    </RadioGroup>
                    {fieldError(error, "family_diabetes")}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingData}
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
