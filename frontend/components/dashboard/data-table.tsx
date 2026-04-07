'use client'

import { OdooTooltip } from '@/components/ui/odoo-tooltip'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { ReportRow } from '@/lib/types'
import { Table, ChevronDown, ChevronRight, Hash } from 'lucide-react'

interface DataTableProps {
    data: ReportRow[]
}

export function DataTable({ data }: DataTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
    const [expandedSessions, setExpandedSessions] = useState<Record<number, boolean>>({})

    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                </CardContent>
            </Card>
        )
    }

    const toggleRow = (fecha: string) => {
        setExpandedRows(prev => ({ ...prev, [fecha]: !prev[fecha] }))
    }
    
    const toggleSession = (sessionId: number) => {
        setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    Jornadas Laborales (Turno 4AM - 4AM)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-sm font-semibold w-32">Fecha</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Cuentas</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Alimentos</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Bebidas</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Propina</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Efectivo</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Tarjeta</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <React.Fragment key={idx}>
                                    <tr 
                                        onClick={() => toggleRow(row.fecha)}
                                        className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3 text-sm flex items-center font-medium text-slate-200">
                                            {expandedRows[row.fecha] ? (
                                                <ChevronDown className="h-4 w-4 mr-2 text-primary" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                                            )}
                                            {row.fecha}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">{row.total_cuentas}</td>
                                        <td className="px-4 py-3 text-right text-sm text-slate-400">{formatCurrency(row.alimentos)}</td>
                                        <td className="px-4 py-3 text-right text-sm text-slate-400">{formatCurrency(row.bebidas)}</td>
                                        <td className="px-4 py-3 text-right text-sm text-emerald-400">{formatCurrency(row.propina)}</td>
                                        <td className="px-4 py-3 text-right text-sm text-blue-400">{formatCurrency(row.restaurante_efectivo)}</td>
                                        <td className="px-4 py-3 text-right text-sm text-purple-400">{formatCurrency(row.tarjeta)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-primary">{formatCurrency(row.total_pagado)}</td>
                                    </tr>
                                    
                                    {expandedRows[row.fecha] && (
                                        <tr className="bg-slate-900/50">
                                            <td colSpan={8} className="p-0 border-b border-border/50">
                                                <div className="py-4 px-10">
                                                    {!row.sesiones || row.sesiones.length === 0 ? (
                                                        <div className="text-center text-amber-500 py-4 font-medium flex items-center justify-center gap-2">
                                                            ⚠️ Los datos de las sesiones no se recibieron. Necesitas reiniciar tu servidor backend (python).
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                 <tr className="text-muted-foreground border-b border-slate-700">
                                                                    <th className="pb-2 text-left font-medium">Nombre de la Sesión</th>
                                                                    <th className="pb-2 text-center font-medium">Cuentas</th>
                                                                    <th className="pb-2 text-right font-medium">Total Pagado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {row.sesiones.map(session => (
                                                                    <React.Fragment key={session.id}>
                                                                        <tr 
                                                                            onClick={() => toggleSession(session.id)}
                                                                            className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800 transition-colors cursor-pointer"
                                                                        >
                                                                            <td className="py-3 text-left font-medium text-slate-300 flex items-center gap-2">
                                                                                {expandedSessions[session.id] ? (
                                                                                    <ChevronDown className="h-3 w-3 text-primary" />
                                                                                ) : (
                                                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                                                )}
                                                                                <Hash className="h-3 w-3 text-primary/50" />
                                                                                {session.name}
                                                                            </td>
                                                                            <td className="py-3 text-center text-slate-400">{session.total_cuentas}</td>
                                                                            <td className="py-3 text-right font-semibold text-emerald-400">
                                                                                {!session.desglose || session.desglose.length <= 1 ? (
                                                                                    <OdooTooltip model="pos.payment" field="amount" filter="Contexto: {}, Obligatorio: True" className="inline-block cursor-help">
                                                                                        {formatCurrency(session.total_pagado)}
                                                                                    </OdooTooltip>
                                                                                ) : (
                                                                                    <OdooTooltip model="pos.payment" field="amount" filter="Contexto: {}, Obligatorio: True" className="inline-flex flex-col items-end cursor-help">
                                                                                        <span>{formatCurrency(session.total_pagado)}</span>
                                                                                        <span className="text-[10.5px] text-slate-500 whitespace-nowrap mt-0.5 font-normal">
                                                                                            ({session.desglose.map(d => `${formatCurrency(d.monto)} del ${d.fecha.split('-')[2]}`).join(" + ")})
                                                                                        </span>
                                                                                    </OdooTooltip>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                        {expandedSessions[session.id] && (
                                                                            <tr>
                                                                                <td colSpan={3} className="p-0">
                                                                                    <div className="bg-slate-900/80 my-2 rounded-lg border border-slate-700/30 overflow-hidden mx-4 pb-2">
                                                                                        {!session.cuentas || session.cuentas.length === 0 ? (
                                                                                            <div className="py-6 text-center text-slate-500 animate-pulse">
                                                                                                No se encontraron detalles de cuentas para esta sesión.
                                                                                            </div>
                                                                                        ) : (
                                                                                            <table className="w-full text-xs">
                                                                                                <thead>
                                                                                                    <tr className="bg-slate-800/80 text-slate-400">
                                                                                                        <th className="py-2 px-4 text-left font-semibold">CUENTA (REF / NOMBRE)</th>
                                                                                                        <th className="py-2 px-4 text-right font-semibold">PROPINA</th>
                                                                                                        <th className="py-2 px-4 text-right font-semibold">IMPORTE TOTAL</th>
                                                                                                        <th className="py-2 px-4 text-center font-semibold text-[10px]">EDO.</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {session.cuentas.map(cuenta => (
                                                                                                        <tr key={cuenta.id} className="border-b border-slate-700/20 hover:bg-slate-700/40 transition-colors">
                                                                                                            <td className="py-2 px-4 text-slate-300 font-medium">{cuenta.nombre}</td>
                                                                                                            <td className="py-2 px-4 text-right text-emerald-500/80">{formatCurrency(cuenta.propina)}</td>
                                                                                                            <td className="py-2 px-4 text-right text-slate-100 font-bold">{formatCurrency(cuenta.total)}</td>
                                                                                                            <td className="py-2 px-4 text-center">
                                                                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                                                                                                    cuenta.estado === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                                                                    cuenta.estado === 'invoiced' ? 'bg-blue-500/10 text-blue-500' :
                                                                                                                    'bg-amber-500/10 text-amber-500'
                                                                                                                }`}>
                                                                                                                    {cuenta.estado?.substring(0, 4)}
                                                                                                                </span>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

