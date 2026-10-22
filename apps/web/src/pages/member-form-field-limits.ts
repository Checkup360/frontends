/**
 * Client-side mirror of the numeric bounds in the backend request model
 * (backend/app/presentation/api/request_models/member_forms.py). It gives
 * immediate feedback; the backend stays authoritative and its 422 responses
 * are still surfaced per field by `submitMemberForm`. Keep both in sync.
 */
const EXCLUSIVE_UPPER_BOUNDS: Record<string, number> = {
  height: 300,
  weight: 500,
  waist_circumference: 300,
  neck_circumference: 100,
  triglycerides: 10000,
  total_cholesterol: 1000,
  hdl_cholesterol: 1000,
  systolic_blood_pressure: 400,
  diastolic_blood_pressure: 300,
  fasting_glucose: 2000,
}

export function hasNumericLimit(field: string): boolean {
  return field in EXCLUSIVE_UPPER_BOUNDS
}

/** Returns an error message for an invalid numeric value, or null when valid. */
export function validateNumericField(
  field: string,
  rawValue: string
): string | null {
  const value = Number(rawValue)
  if (rawValue.trim() === "" || Number.isNaN(value) || value <= 0) {
    return "Please enter a valid value."
  }
  const upperBound = EXCLUSIVE_UPPER_BOUNDS[field]
  if (upperBound !== undefined && value >= upperBound) {
    return `Please enter a value below ${upperBound}.`
  }
  return null
}
