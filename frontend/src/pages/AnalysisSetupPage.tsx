import { useCallback, useId, useRef, useState } from 'react'

import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { SectionHeader } from '@/components/common/SectionHeader'
import { cn } from '@/utils/cn'

import { SUPPORTED_CROPS } from '@/config/crops'
import type { CropId } from '@/types/crop'
import type { SetupPayload } from '@/types/setup'

const INPUT_BASE =
  'h-11 w-full rounded-lg border bg-field px-3.5 text-body text-ink placeholder:text-ink-disabled transition-colors focus:outline-none focus:ring-2'

const UOM_CLASSES =
  'inline-flex items-center rounded-r-lg border-l border-border bg-muted px-3 text-body text-ink-secondary'

const CROP_REQUIRED_MESSAGE = 'Crop is required to start analysis.'

export interface AnalysisSetupPageProps {
  /** Receives the validated setup values, then navigation to #processing. */
  onSubmitSetup: (payload: SetupPayload) => void
}

export function AnalysisSetupPage({ onSubmitSetup }: AnalysisSetupPageProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const lotId = useId()
  const weightId = useId()
  const moistureId = useId()
  const cropErrorId = useId()

  const [lotNumber, setLotNumber] = useState('')
  const [sampleWeight, setSampleWeight] = useState('')
  const [moisture, setMoisture] = useState('')
  const [crop, setCrop] = useState<CropId | null>(null) // null = no crop selected yet

  const [lotError, setLotError] = useState<string | null>(null)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [moistureError, setMoistureError] = useState<string | null>(null)
  const [cropError, setCropError] = useState<string | null>(null)

  const lotInputRef = useRef<HTMLInputElement>(null)
  const weightInputRef = useRef<HTMLInputElement>(null)
  const moistureInputRef = useRef<HTMLInputElement>(null)
  const cropCardRef = useRef<HTMLButtonElement | null>(null)
  const focusFirstInvalidOnSubmit = useCallback(
    (cropMissing: boolean) => {
      if (lotError !== null && lotInputRef.current) {
        lotInputRef.current.focus()
        return
      }
      if (weightError !== null && weightInputRef.current) {
        weightInputRef.current.focus()
        return
      }
      if (moistureError !== null && moistureInputRef.current) {
        moistureInputRef.current.focus()
        return
      }
      if (cropMissing && cropCardRef.current) {
        cropCardRef.current.focus()
      }
    },
    [lotError, weightError, moistureError, lotInputRef, weightInputRef, moistureInputRef, cropCardRef],
  )

  const validateLot = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (trimmed === '') return 'Lot number is required.'
      return null
    },
    [],
  )

  const validateWeight = useCallback(
    (value: string) => {
      const n = parseFloat(value)
      if (Number.isNaN(n)) return 'Enter a valid sample weight.'
      if (n <= 0) return 'Enter a valid sample weight.'
      return null
    },
    [],
  )

  const validateMoisture = useCallback(
    (value: string) => {
      const n = parseFloat(value)
      if (value === '' || Number.isNaN(n)) return 'Enter a valid moisture value.'
      if (n < 0 || n > 100) return 'Moisture must be between 0 and 100%.'
      return null
    },
    [],
  )

  const onLotChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLotNumber(e.target.value)
      setLotError(validateLot(e.target.value))
    },
    [setLotNumber, setLotError, validateLot],
  )

  // Messages must clear as soon as the user fixes the input, so every change
  // handler revalidates instead of leaving a submit-time error behind.

  const onWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSampleWeight(e.target.value)
      setWeightError(validateWeight(e.target.value))
    },
    [setSampleWeight, setWeightError, validateWeight],
  )

  const onMoistureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMoisture(e.target.value)
      setMoistureError(validateMoisture(e.target.value))
    },
    [setMoisture, setMoistureError, validateMoisture],
  )

  const onCropSelect = useCallback(
    (id: CropId) => {
      setCrop(id)
      // A valid selection immediately clears a stale crop-required message.
      setCropError(null)
    },
    [setCrop, setCropError],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const lotErr = validateLot(lotNumber)
      if (lotErr) {
        setLotError(lotErr)
        focusFirstInvalidOnSubmit(false)
        return
      }

      const weightErr = validateWeight(sampleWeight)
      if (weightErr) {
        setWeightError(weightErr)
        focusFirstInvalidOnSubmit(false)
        return
      }

      const moistureErr = validateMoisture(moisture)
      if (moistureErr) {
        setMoistureError(moistureErr)
        focusFirstInvalidOnSubmit(false)
        return
      }

      // Same canonical `crop` state the selection cards update.
      if (crop === null) {
        setCropError(CROP_REQUIRED_MESSAGE)
        focusFirstInvalidOnSubmit(true)
        return
      }

      // Frontend state transition only. No API call, no fake ID/generated
      // values. The payload is handed to the app-level store, which keeps
      // the setup values so Back to Setup can repopulate the form.
      onSubmitSetup({
        crop,
        lotNumber: lotNumber.trim(),
        sampleWeight: parseFloat(sampleWeight),
        moisture: parseFloat(moisture),
      })
      window.location.hash = '#processing'
    },
    [
      lotNumber,
      sampleWeight,
      moisture,
      crop,
      validateLot,
      validateWeight,
      validateMoisture,
      setLotError,
      setWeightError,
      setMoistureError,
      setCropError,
      onSubmitSetup,
      focusFirstInvalidOnSubmit,
    ],
  )

  const lotInvalid = lotError !== null
  const weightInvalid = weightError !== null
  const moistureInvalid = moistureError !== null
  const cropInvalid = cropError !== null

  return (
    <div className="space-y-3">
      <SectionHeader
        as="h1"
        title="Analysis Setup"
        description="Enter the sample details before starting the analysis."
        className="mb-1"
      />

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* General Details */}
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="General Details"
            description="Lot number, sample weight, and moisture."
            as="h2"
          />

          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label
                htmlFor={lotId}
                className="block text-label font-medium text-ink-secondary"
              >
                Lot Number
              </label>
              <input
                id={lotId}
                name="lotNumber"
                type="text"
                autoComplete="off"
                value={lotNumber}
                ref={lotInputRef}
                onChange={onLotChange}
                placeholder="Enter lot number"
                className={cn(
                  INPUT_BASE,
                  lotInvalid && 'border-danger focus:ring-danger/25',
                )}
                aria-invalid={lotInvalid || undefined}
                aria-describedby={lotInvalid ? `${lotId}-error` : undefined}
                aria-required="true"
              />
              {lotInvalid && (
                <p id={`${lotId}-error`} className="text-helper text-danger">
                  {lotError}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor={weightId}
                className="block text-label font-medium text-ink-secondary"
              >
                Sample Weight
              </label>
              <div className="flex">
                <input
                  id={weightId}
                  name="sampleWeight"
                  type="number"
                  inputMode="decimal"
                  value={sampleWeight}
                  ref={weightInputRef}
                  onChange={onWeightChange}
                  placeholder="Enter sample weight"
                  min="0"
                  step="0.01"
                  className={cn(
                    INPUT_BASE,
                    weightInvalid && 'border-danger focus:ring-danger/25',
                  )}
                  aria-invalid={weightInvalid || undefined}
                  aria-describedby={
                    weightInvalid ? `${weightId}-error` : undefined
                  }
                  aria-required="true"
                />
                <span className={UOM_CLASSES} aria-hidden="true">g</span>
              </div>
              {weightInvalid && (
                <p id={`${weightId}-error`} className="text-helper text-danger">
                  {weightError}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor={moistureId}
                className="block text-label font-medium text-ink-secondary"
              >
                Moisture
              </label>
              <div className="flex">
                <input
                  id={moistureId}
                  name="moisture"
                  type="number"
                  inputMode="decimal"
                  value={moisture}
                  ref={moistureInputRef}
                  onChange={onMoistureChange}
                  placeholder="Enter moisture"
                  min="0"
                  max="100"
                  step="0.1"
                  className={cn(
                    INPUT_BASE,
                    moistureInvalid && 'border-danger focus:ring-danger/25',
                  )}
                  aria-invalid={moistureInvalid || undefined}
                  aria-describedby={
                    moistureInvalid ? `${moistureId}-error` : undefined
                  }
                  aria-required="true"
                />
                <span className={UOM_CLASSES} aria-hidden="true">%</span>
              </div>
              {moistureInvalid && (
                <p id={`${moistureId}-error`} className="text-helper text-danger">
                  {moistureError}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Crop Selection */}
        <Card aria-describedby={cropInvalid ? cropErrorId : undefined} className="p-4 sm:p-5">
          <SectionHeader
            title="Set Crop"
            description="Select the crop to analyse."
            as="h2"
          />

          <div
            role="radiogroup"
            aria-label="Crop selection"
            className="mt-3 grid gap-3 sm:grid-cols-2"
          >
            {SUPPORTED_CROPS.map((c) => {
              const selected = crop === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${c.name} — ${selected ? 'selected' : 'not selected'}`}
                  ref={cropCardRef}
                  onClick={() => onCropSelect(c.id)}
                  className={cn(
                    'flex w-full flex-col items-center gap-2 rounded-xl border-2 bg-surface px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                    selected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border text-ink hover:border-primary-400 hover:bg-primary-50/40',
                  )}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className={cn(
                      'h-7 w-7',
                      selected ? 'text-primary-600' : 'text-ink-muted',
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3c1.5 2.5 3 5 3 8 0 2.5-1.5 4.5-3 6 1.5 1 3 3 3 6 0 3-2 5.5-5 6.5-3-1-5-3.5-5-6.5 0-3 1.5-5 3-6-1.5-1.5-3-3.5-3-6 0-3 1.5-5.5 3-8Z" />
                  </svg>
                  <span className="text-section-title font-medium">{c.name}</span>
                </button>
              )
            })}
          </div>
          {cropInvalid && (
            <p id={cropErrorId} className="mt-2 text-helper text-danger">{cropError}</p>
          )}
        </Card>

        {/* Submit — DEV-ONLY route check control will live in App, not here. */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
            Start Analysis
          </Button>
        </div>
      </form>
    </div>
  )
}
