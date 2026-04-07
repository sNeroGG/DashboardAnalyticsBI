import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dashboard/data-table'
import { formatCurrency } from '@/lib/utils'
import type { ReportData, Masters } from '@/lib/types'
import { Users, CreditCard, Table as TableIcon } from 'lucide-react'

interface ReportTabsProps {
    reportData: ReportData
    masters: Masters
    selectedPayments: number[]
}

export function ReportTabs({ reportData, masters, selectedPayments }: ReportTabsProps) {
    const [activeTab, setActiveTab] = useState<'jornadas' | 'usuarios' | 'metodos'>('jornadas')

    // Mapear los métodos de la API de Masters
    const metodosMaestros = masters['pos.payment.method'] || []

    // Cruzar métodos retornados con los maestros para asegurar los $0
    const metodosCalculados = metodosMaestros.map(m => {
        // Encontrar lo que devolvió el backend para este método
        const backP = reportData.metodos?.find((row: any) => row.metodo === m.name)
        // Si el usuario aplicó filtros y el método NO ESTÁ en el filtro, forzamos a 0
        // (De hecho, si no se encontró en backend ya es 0)
        let monto = backP ? backP.monto : 0

        // Regla estricta: Si hay selección en el filtro y ESTE método no fue seleccionado, forzamos a 0
        if (selectedPayments.length > 0 && !selectedPayments.includes(m.id)) {
            monto = 0
        }

        return {
            metodo: m.name,
            monto: monto
        }
    }).sort((a, b) => b.monto - a.monto)

    return (
        <div className="space-y-4">
            {/* Pestañas / Botonera */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveTab('jornadas')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'jornadas' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground'
                    }`}
                >
                    <TableIcon className="h-4 w-4" />
                    Jornadas Laborales
                </button>
                <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'usuarios' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground'
                    }`}
                >
                    <Users className="h-4 w-4" />
                    Ventas por Usuario
                </button>
                <button
                    onClick={() => setActiveTab('metodos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'metodos' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground'
                    }`}
                >
                    <CreditCard className="h-4 w-4" />
                    Métodos de Pago
                </button>
            </div>

            {/* Contenido */}
            <div className="mt-4">
                {activeTab === 'jornadas' && (
                    <DataTable data={reportData.data || []} />
                )}

                {activeTab === 'usuarios' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Desempeño de Usuarios (Cajeros/Vendedores)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Cajero / Usuario</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold">Cuentas Cobradas</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold">Ventas Acumuladas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.usuarios?.map((u: any, idx: number) => (
                                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-slate-200">
                                                    {u.nombre}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-400">
                                                    {u.cuentas}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-emerald-400">
                                                    {formatCurrency(u.ventas)}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!reportData.usuarios || reportData.usuarios.length === 0) && (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-muted-foreground">No hay datos de usuarios para este periodo.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'metodos' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Cantidad por Efectivo y Tarjeta
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full max-w-2xl mx-auto">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Método de Pago</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold">Monto Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metodosCalculados.map((m: any, idx: number) => (
                                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-slate-200">
                                                    {m.metodo}
                                                </td>
                                                <td className={`px-4 py-3 text-right text-sm font-bold ${m.monto > 0 ? 'text-primary' : 'text-slate-600'}`}>
                                                    {formatCurrency(m.monto)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
