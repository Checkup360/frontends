export async function readFastApiErrorDetail(
  response: Response
): Promise<unknown> {
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed) {
    return undefined
  }
  try {
    const json = JSON.parse(trimmed) as { detail?: unknown }
    return json.detail ?? json
  } catch {
    return trimmed
  }
}
