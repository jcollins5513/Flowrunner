// Simple form renderer for DSL form components
'use client'

import React from 'react'

interface FormField {
  id: string
  label: string
  placeholder?: string
  type?: string
}

export interface FormProps {
  content: string
  fields?: FormField[]
  submitLabel?: string
  className?: string
  style?: React.CSSProperties
}

export const Form: React.FC<FormProps> = ({
  content,
  fields = [],
  submitLabel = 'Submit',
  className = '',
  style,
}) => {
  return (
    <form
      className={`flex flex-col gap-4 bg-white/70 backdrop-blur rounded-xl p-6 shadow-sm ${className}`}
      style={style}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="text-lg font-semibold text-gray-900">{content}</div>
      {fields.map((field) => (
        <label key={field.id} className="flex flex-col gap-1 text-sm text-gray-700">
          {field.label}
          <input
            type={field.type ?? 'text'}
            placeholder={field.placeholder}
            className="rounded-lg border border-gray-200 px-3 py-2 focus:border-gray-400 focus:outline-none"
          />
        </label>
      ))}
      <button
        type="submit"
        className="mt-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  )
}

