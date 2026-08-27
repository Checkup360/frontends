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
  AlertCircle,
  ArrowLeft,
  Info,
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  fetchMemberForm,
  submitMemberForm,
} from "@workspace/api"

type FormType = "biometrics" | "sleep" | "habits"

type StudiesData = {
  neck_circumference: string
  waist_circumference: string
  snoring: string
  tired: string
  observed_apnea: string
  hypertension_medication: string
  daily_physical_activity: string
  fruits_vegetables: string
  previous_high_glucose: string
  family_diabetes: string
}

const initialData: StudiesData = {
  neck_circumference: "",
  waist_circumference: "",
  snoring: "",
  tired: "",
  observed_apnea: "",
  hypertension_medication: "",
  daily_physical_activity: "",
  fruits_vegetables: "",
  previous_high_glucose: "",
  family_diabetes: "",
}

export function MemberFormsStudiesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const formType: FormType =
    (searchParams.get("form") as FormType) ||
    (searchParams.get("tab") as FormType) ||
    "biometrics"

  const [data, setData] = useState<StudiesData>(initialData)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setIsLoadingData(true)
      const [biometricsForm, sleepForm, habitsForm] = await Promise.all([
        fetchMemberForm("biometrics"),
        fetchMemberForm("sleep"),
        fetchMemberForm("habits"),
      ])

      if (!cancelled) {
        const bioData = biometricsForm?.data || {}
        const sleepData = sleepForm?.data || {}
        const habitsData = habitsForm?.data || {}

        setData({
          waist_circumference: bioData.waist_circumference
            ? String(bioData.waist_circumference)
            : "",
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
          family_diabetes: (habitsData.family_diabetes as string) || "",
        })
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
    if (!data.neck_circumference || isNaN(Number(data.neck_circumference)) || Number(data.neck_circumference) <= 0) {
      errors.neck_circumference = "Please enter a valid neck circumference (cm)."
    }
    if (!data.waist_circumference || isNaN(Number(data.waist_circumference)) || Number(data.waist_circumference) <= 0) {
      errors.waist_circumference = "Please enter a valid waist circumference (cm)."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      scrollToFirstError(errors)
      return
    }

    setIsSubmitting(true)
    const res = await submitMemberForm("biometrics", {
      neck_circumference: Number(data.neck_circumference),
      waist_circumference: Number(data.waist_circumference),
    })
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
    if (!data.observed_apnea) errors.observed_apnea = "Please select an option for sleep apnea observation."

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
    if (!data.hypertension_medication) errors.hypertension_medication = "Please select an option for blood pressure medication."
    if (!data.daily_physical_activity) errors.daily_physical_activity = "Please select an option for daily physical activity."
    if (!data.fruits_vegetables) errors.fruits_vegetables = "Please select an option for fruit/vegetable consumption."
    if (!data.previous_high_glucose) errors.previous_high_glucose = "Please select an option for previous high blood glucose."
    if (!data.family_diabetes) errors.family_diabetes = "Please select an option for family history of diabetes."

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

  const titlesMap: Record<FormType, { title: string; description: string }> = {
    biometrics: {
      title: "Physical Biometrics Form",
      description: "Enter your body measurements for neck and waist circumference.",
    },
    sleep: {
      title: "Sleep Quality Form",
      description: "Answer questions regarding your daily sleep habits and rest.",
    },
    habits: {
      title: "Lifestyle & Habits Form",
      description: "Information regarding physical activity, diet, and health history.",
    },
  }

  const currentTitle = titlesMap[formType] || titlesMap.biometrics

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {currentTitle.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentTitle.description}
          </p>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Physical Measurements</CardTitle>
            <CardDescription>
              Enter your neck and waist body measurements.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void handleSaveBiometrics(e)}>
            <CardContent className="space-y-6">
              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Height and weight biometrics are managed via your profile. You can update them in <Link to="/settings" className="font-semibold underline">Settings</Link>.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-2">
                <div
                  id="field-group-neck_circumference"
                  className={cn(
                    "space-y-2 rounded-lg p-3 transition-all",
                    fieldErrors.neck_circumference && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <Label htmlFor="neck_circumference" className="font-medium">
                    Neck Circumference (cm)
                  </Label>
                  <Input
                    id="neck_circumference"
                    type="number"
                    placeholder="e.g. 38"
                    value={data.neck_circumference}
                    onChange={(e) => updateField("neck_circumference", e.target.value)}
                    disabled={isSubmitting || isLoadingData}
                    className={cn(fieldErrors.neck_circumference && "border-destructive focus-visible:ring-destructive")}
                  />
                  {fieldErrors.neck_circumference && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {fieldErrors.neck_circumference}
                    </p>
                  )}
                </div>

                <div
                  id="field-group-waist_circumference"
                  className={cn(
                    "space-y-2 rounded-lg p-3 transition-all",
                    fieldErrors.waist_circumference && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  )}
                >
                  <Label htmlFor="waist_circumference" className="font-medium">
                    Waist Circumference (cm)
                  </Label>
                  <Input
                    id="waist_circumference"
                    type="number"
                    placeholder="e.g. 85"
                    value={data.waist_circumference}
                    onChange={(e) => updateField("waist_circumference", e.target.value)}
                    disabled={isSubmitting || isLoadingData}
                    className={cn(fieldErrors.waist_circumference && "border-destructive focus-visible:ring-destructive")}
                  />
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
        <Card>
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
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.snoring && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.tired && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.observed_apnea && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
        <Card>
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
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.hypertension_medication && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.daily_physical_activity && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.fruits_vegetables && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
                    <Label htmlFor="fv-yes" className="cursor-pointer font-normal">
                      Every day
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="fv-no" />
                    <Label htmlFor="fv-no" className="cursor-pointer font-normal">
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
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.previous_high_glucose && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
                {fieldErrors.previous_high_glucose && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {fieldErrors.previous_high_glucose}
                  </p>
                )}
              </div>

              {/* Question 5 */}
              <div
                id="field-group-family_diabetes"
                className={cn(
                  "space-y-3 rounded-lg p-4 transition-all",
                  fieldErrors.family_diabetes && "border-2 border-destructive bg-destructive/10 ring-1 ring-destructive/30"
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
                    <Label htmlFor="fd-no" className="cursor-pointer font-normal">
                      No
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="second_degree" id="fd-yes2" />
                    <Label htmlFor="fd-yes2" className="cursor-pointer font-normal">
                      Yes: grandparent, aunt, uncle, or first cousin
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first_degree" id="fd-yes1" />
                    <Label htmlFor="fd-yes1" className="cursor-pointer font-normal">
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
    </div>
  )
}
