export function formatEnumLabel(value: string): string {
  const label = value.replace(/_/g, " ")
  return label.charAt(0).toUpperCase() + label.slice(1)
}
