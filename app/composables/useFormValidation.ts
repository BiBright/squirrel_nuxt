interface ValidatableField {
  id: number
  name: string
  required: boolean
}

interface UseFormValidationOptions {
  fields: Ref<ValidatableField[]> | ComputedRef<ValidatableField[]>
  answers: Record<number, string>
  uploadedFiles: Record<number, File>
  getExistingFile?: (fieldId: number) => string | null | undefined
  needsFile?: (field: ValidatableField) => boolean
}

export function useFormValidation({
  fields,
  answers,
  uploadedFiles,
  getExistingFile,
  needsFile,
}: UseFormValidationOptions) {
  const fieldErrors = reactive<Record<number, string>>({})

  function validate(): boolean {
    for (const key of Object.keys(fieldErrors)) delete fieldErrors[Number(key)]

    for (const field of fields.value) {
      if (!field.required) continue

      if (needsFile?.(field)) {
        const hasNew = !!uploadedFiles[field.id]
        const hasExisting = !!getExistingFile?.(field.id)
        if (!hasNew && !hasExisting) fieldErrors[field.id] = `${field.name} is required`
      }
      else {
        const val = answers[field.id]
        if (!val || val.trim() === '') fieldErrors[field.id] = `${field.name} is required`
      }
    }

    const errorIds = Object.keys(fieldErrors).map(Number)
    if (errorIds.length > 0) {
      const el = document.querySelector(`[data-field-id="${errorIds[0]}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return errorIds.length === 0
  }

  return { fieldErrors, validate }
}
