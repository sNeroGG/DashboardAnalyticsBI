import React from 'react'

interface OdooTooltipProps {
  children: React.ReactNode
  model: string
  field: string
  filter?: string
  className?: string
}

export function OdooTooltip({ children, model, field, filter, className = "" }: OdooTooltipProps) {
  return (
    <div className={`relative group ${className}`}>
      {children}
      <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition duration-300 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-slate-900 text-white text-xs rounded-md p-4 shadow-xl border border-slate-700 pointer-events-none">
        <div className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1">Datos de Petición Odoo</div>
        <ul className="list-disc pl-4 space-y-1 text-slate-300">
          <li><span className="font-semibold text-white">Modelo:</span> {model}</li>
          <li><span className="font-semibold text-white">Campo(s):</span> {field}</li>
          {filter && <li><span className="font-semibold text-white">Info:</span> {filter}</li>}
        </ul>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  )
}
