import type { ActiveSession } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface PrintActiveSessionsSummaryProps {
    sessions: ActiveSession[]
    isActive: boolean
}

export function PrintActiveSessionsSummary({ sessions, isActive }: PrintActiveSessionsSummaryProps) {
    return (
        <div className="w-full text-black font-sans bg-white p-6">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-4">
                <h1 className="text-lg font-black uppercase tracking-wider text-black">
                    {isActive ? 'Reporte de Sesiones Activas (En Vivo)' : 'Reporte de Últimas Sesiones Cerradas'}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-1">
                    Generado el {new Date().toLocaleString('es-ES', { timeZone: 'America/El_Salvador' })} | BI Analytics Herradura
                </p>
            </div>

            {sessions.map((session, sIdx) => {
                // Calcular estadísticas por estado para esta sesión en base a sus cuentas actuales
                const sessionSummary = {
                    draft: { count: 0, total: 0 },
                    paid: { count: 0, total: 0 },
                    invoiced: { count: 0, total: 0 },
                    done: { count: 0, total: 0 },
                    cancel: { count: 0, total: 0 }
                }
                
                session.cuentas?.forEach(c => {
                    const state = c.estado || 'draft'
                    if (state in sessionSummary) {
                        sessionSummary[state as keyof typeof sessionSummary].count += 1
                        sessionSummary[state as keyof typeof sessionSummary].total += c.total || 0
                    }
                })

                return (
                    <div key={session.id} className={`${sIdx > 0 ? 'mt-10 pt-10 border-t border-dashed border-gray-400' : ''}`}>
                        {/* Session Metadata */}
                        <div className="bg-gray-100 p-3 border border-black mb-4 rounded">
                            <table className="w-full text-xs">
                                <tbody>
                                    <tr>
                                        <td className="font-bold py-1 w-24">Sesión:</td>
                                        <td className="py-1">{session.name}</td>
                                        <td className="font-bold py-1 text-right w-24">Cajero:</td>
                                        <td className="text-right py-1">{session.cashier}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold py-1">Apertura:</td>
                                        <td className="py-1">{session.start_at}</td>
                                        <td className="font-bold py-1 text-right">Cuentas:</td>
                                        <td className="text-right py-1">{session.total_cuentas}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Session Metrics */}
                        <div className="mb-6">
                            <h2 className="text-xs font-black uppercase border-b-2 border-black pb-1 mb-2 text-gray-800 tracking-wide">
                                Resumen Financiero de la Sesión
                            </h2>
                            <table className="w-full text-left border-collapse text-xs">
                                <tbody>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-1.5 font-medium text-gray-600">Alimentos:</th>
                                        <td className="py-1.5 text-right font-semibold">{formatCurrency(session.alimentos)}</td>
                                        <th className="py-1.5 font-medium text-gray-600 pl-8">Efectivo:</th>
                                        <td className="py-1.5 text-right font-semibold text-blue-800">{formatCurrency(session.restaurante_efectivo)}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-1.5 font-medium text-gray-600">Bebidas:</th>
                                        <td className="py-1.5 text-right font-semibold">{formatCurrency(session.bebidas)}</td>
                                        <th className="py-1.5 font-medium text-gray-600 pl-8">Tarjeta:</th>
                                        <td className="py-1.5 text-right font-semibold text-purple-800">{formatCurrency(session.tarjeta)}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-1.5 font-medium text-gray-600">Otros/Varios:</th>
                                        <td className="py-1.5 text-right font-semibold">{formatCurrency(session.otros)}</td>
                                        <th className="py-1.5 font-medium text-gray-600 pl-8">Propina:</th>
                                        <td className="py-1.5 text-right font-bold text-green-700">{formatCurrency(session.propina)}</td>
                                    </tr>
                                    <tr className="border-b-2 border-black bg-gray-50">
                                        <th className="py-2.5 font-black text-sm text-black">Total Facturado:</th>
                                        <td className="py-2.5 text-right text-sm font-black text-black">{formatCurrency(session.total_pagado)}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Resumen por Estado (Print styled) */}
                        <div className="mb-6">
                            <h2 className="text-xs font-black uppercase border-b-2 border-black pb-1 mb-2 text-gray-800 tracking-wide">
                                Resumen de Cuentas por Estado
                            </h2>
                            <table className="w-full text-left border-collapse text-[10px] border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-300">
                                        <th className="py-1.5 px-3 font-bold border-r border-gray-300">Estado</th>
                                        <th className="py-1.5 px-3 font-bold text-center border-r border-gray-300 w-32">Cantidad Cuentas</th>
                                        <th className="py-1.5 px-3 font-bold text-right w-44">Importe Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: 'Borrador', stats: sessionSummary.draft },
                                        { name: 'Pagado', stats: sessionSummary.paid },
                                        { name: 'Facturado', stats: sessionSummary.invoiced },
                                        { name: 'Publicado', stats: sessionSummary.done },
                                        { name: 'Cancelado', stats: sessionSummary.cancel }
                                    ].map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                                            <td className="py-1.5 px-3 font-medium border-r border-gray-300 text-gray-800">{item.name}</td>
                                            <td className="py-1.5 px-3 text-center border-r border-gray-300 text-gray-700 font-semibold">{item.stats.count}</td>
                                            <td className="py-1.5 px-3 text-right font-bold text-black">{formatCurrency(item.stats.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Account Details */}
                        <div>
                            <h2 className="text-xs font-black uppercase border-b-2 border-black pb-1 mb-2 text-gray-800 tracking-wide">
                                Detalle de Cuentas / Tickets
                            </h2>
                            <table className="w-full text-left border-collapse text-[10px]">
                                <thead>
                                    <tr className="border-b border-black text-gray-700 bg-gray-100">
                                        <th className="py-2 px-3 font-bold">Cuenta</th>
                                        <th className="py-2 px-3 text-right font-bold w-28">Propina</th>
                                        <th className="py-2 px-3 text-right font-bold w-28">Total</th>
                                        <th className="py-2 px-3 text-center font-bold w-28">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.cuentas && session.cuentas.length > 0 ? (
                                        session.cuentas.map((cuenta) => (
                                            <tr key={cuenta.id} className="border-b border-gray-200">
                                                <td className="py-2 px-3 font-semibold text-gray-800">{cuenta.nombre}</td>
                                                <td className="py-2 px-3 text-right font-medium text-green-700">{formatCurrency(cuenta.propina)}</td>
                                                <td className="py-2 px-3 text-right font-bold text-black">{formatCurrency(cuenta.total)}</td>
                                                <td className="py-2 px-3 text-center text-gray-600 uppercase font-bold text-[9px]">{cuenta.estado}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-gray-500 italic">
                                                No hay cuentas registradas en esta sesión.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
