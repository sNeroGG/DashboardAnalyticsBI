import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ReportRow } from '@/lib/types'
import { TrendingUp, PieChartIcon } from 'lucide-react'
import { OdooTooltip } from '@/components/ui/odoo-tooltip'

interface ChartsSectionProps {
    data: ReportRow[]
}

export function ChartsSection({ data }: ChartsSectionProps) {
    const lineData = data.map(row => ({
        fecha: row.fecha,
        ventas: row.total_pagado,
    }))

    const pieData = [
        { name: 'Alimentos', value: data.reduce((sum, row) => sum + row.alimentos, 0), color: '#e94560' },
        { name: 'Bebidas', value: data.reduce((sum, row) => sum + row.bebidas, 0), color: '#0f3460' },
        { name: 'Propina', value: data.reduce((sum, row) => sum + row.propina, 0), color: '#16a085' },
        { name: 'Otros', value: data.reduce((sum, row) => sum + row.otros, 0), color: '#f39c12' },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
                <CardHeader>
                    <OdooTooltip model="pos.order" field="date_order, amount_total" filter="Agrupado por día de inicio de sesión" className="w-fit">
                        <CardTitle className="flex items-center gap-2 cursor-help">
                            <TrendingUp className="h-5 w-5" />
                            Ventas por Día
                        </CardTitle>
                    </OdooTooltip>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="fecha" stroke="#fff" fontSize={12} />
                            <YAxis stroke="#fff" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#16213e', border: '1px solid #e94560', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ color: '#fff' }} />
                            <Line type="monotone" dataKey="ventas" stroke="#e94560" strokeWidth={3} dot={{ fill: '#e94560', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <OdooTooltip model="pos.order" field="Calculado" filter="Proporciones sobre el monto gastable" className="w-fit">
                        <CardTitle className="flex items-center gap-2 cursor-help">
                            <PieChartIcon className="h-5 w-5" />
                            Distribución
                        </CardTitle>
                    </OdooTooltip>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#16213e', border: '1px solid #e94560', borderRadius: '8px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
