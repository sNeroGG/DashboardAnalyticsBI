import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { ReportRow } from '@/lib/types'
import { TrendingUp, PieChartIcon, CreditCard } from 'lucide-react'
import { OdooTooltip } from '@/components/ui/odoo-tooltip'

interface ChartsSectionProps {
    data: ReportRow[]
}

export function ChartsSection({ data }: ChartsSectionProps) {
    const formatCurrency = (value: any) => {
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(numValue);
    };
    const lineData = data.map(row => ({
        fecha: row.fecha,
        ventas: row.total_pagado,
    }))

    const paymentData = data.map(row => ({
        fecha: row.fecha,
        efectivo: row.restaurante_efectivo,
        tarjeta: row.tarjeta
    }))

    const parseSafe = (val: any) => typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val) || 0;

    const pieData = [
        { name: 'Alimentos', value: data.reduce((sum, row) => sum + parseSafe(row.alimentos), 0), color: '#e94560' },
        { name: 'Bebidas', value: data.reduce((sum, row) => sum + parseSafe(row.bebidas), 0), color: '#4a97f5ff' },
        { name: 'Propina', value: data.reduce((sum, row) => sum + parseSafe(row.propina), 0), color: '#16a085' },
        { name: 'Otros', value: data.reduce((sum, row) => sum + parseSafe(row.otros), 0), color: '#f39c12' },
    ]

    return (
        <div className="flex flex-col gap-4">
            {/* 1 GRANDE */}
            <Card className="w-full">
                <CardHeader>
                    <OdooTooltip model="pos.order" field="date_order, amount_total" filter="Agrupado por día de inicio de sesión" className="w-fit">
                        <CardTitle className="flex items-center gap-2 cursor-help">
                            <TrendingUp className="h-5 w-5" />
                            Evolución de Ventas por Día
                        </CardTitle>
                    </OdooTooltip>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="fecha" stroke="#fff" fontSize={12} />
                            <YAxis stroke="#fff" fontSize={12} />
                            <Tooltip
                                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                contentStyle={{ backgroundColor: '#16213e', border: '1px solid #e94560', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ color: '#fff' }} />
                            <Line type="monotone" name="Total Facturado" dataKey="ventas" stroke="#e94560" strokeWidth={4} dot={{ fill: '#e94560', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 2 PEQUEÑAS DEBAJO */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <OdooTooltip model="pos.order" field="Calculado" filter="Proporciones sobre el monto gastable" className="w-fit">
                            <CardTitle className="flex items-center gap-2 cursor-help">
                                <PieChartIcon className="h-5 w-5" />
                                Distribución de Consumo
                            </CardTitle>
                        </OdooTooltip>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(entry) => formatCurrency(entry.value)}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                    contentStyle={{ backgroundColor: '#16213e', border: '1px solid #e94560', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Tipos de Pago por Día
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={paymentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="fecha" stroke="#fff" fontSize={10} />
                                <YAxis stroke="#fff" fontSize={10} />
                                <Tooltip
                                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                    contentStyle={{ backgroundColor: '#16213e', border: '1px solid #0f3460', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="efectivo" name="Efectivo" stackId="a" fill="#16a085" />
                                <Bar dataKey="tarjeta" name="Tarjeta" stackId="a" fill="#0f3460" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
