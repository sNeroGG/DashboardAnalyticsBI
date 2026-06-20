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
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <OdooTooltip model="pos.category" field="product_group" filter="Venta real agrupada por el campo 'product_group' en las categorías del punto de venta en Odoo." className="w-fit">
                            <CardTitle className="flex items-center gap-2 cursor-help text-base font-semibold">
                                <PieChartIcon className="h-5 w-5" />
                                Distribución de Consumo
                            </CardTitle>
                        </OdooTooltip>
                        <div className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                            Total: {formatCurrency(pieData.reduce((sum, item) => sum + item.value, 0))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                layout="vertical"
                                data={pieData}
                                margin={{ top: 20, right: 60, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" stroke="#fff" fontSize={9} tickFormatter={(val) => formatCurrency(val)} />
                                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={70} />
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value), 'Monto']}
                                    contentStyle={{ backgroundColor: '#16213e', border: '1px solid #e94560', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar 
                                    dataKey="value" 
                                    radius={[0, 4, 4, 0]} 
                                    label={{ 
                                        position: 'right', 
                                        fill: '#fff', 
                                        fontSize: 9, 
                                        formatter: (val: number) => formatCurrency(val) 
                                    }}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
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
