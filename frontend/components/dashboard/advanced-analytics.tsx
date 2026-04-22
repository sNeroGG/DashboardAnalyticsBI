import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CalendarDays, Users, DollarSign, Activity, BarChart as BarChartIcon, Info } from 'lucide-react'
import type { ReportData } from '@/lib/types'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend, Cell, LineChart, Line } from 'recharts'

interface AdvancedAnalyticsProps {
    reportData: ReportData
}

export function AdvancedAnalytics({ reportData }: AdvancedAnalyticsProps) {
    const advanced = reportData.advanced_analytics
    
    if (!advanced) {
        return (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/30">
                <Activity className="h-12 w-12 text-muted-foreground animate-pulse mb-4" />
                <p className="text-muted-foreground font-medium">No hay datos de analítica disponibles para este rango.</p>
            </div>
        )
    }

    const { proyeccion_mes, analisis_semanal } = advanced

    const proyeccionData = [
        {
            name: "Comparativa Mes",
            "Acumulado": proyeccion_mes.venta_acumulada || 0,
            "Proyectado (Restante)": Math.max(0, (proyeccion_mes.venta_proyectada || 0) - (proyeccion_mes.venta_acumulada || 0))
        }
    ]

    const customTooltipFormatter = (value: number) => {
        return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Tarjetas de Proyección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Venta Acumulada
                        </CardTitle>
                        <div className="bg-primary/20 p-2 rounded-full">
                            <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground">
                            ${(proyeccion_mes.venta_acumulada || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            En {proyeccion_mes.dias_transcurridos || 0} días evaluados
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Proyección de Cierre
                        </CardTitle>
                        <div className="bg-green-500/20 p-2 rounded-full">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-green-500">
                            ${(proyeccion_mes.venta_proyectada || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Proyectado a {proyeccion_mes.dias_totales_mes || 0} días (Promedio: ${(proyeccion_mes.promedio_diario || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}/día)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos de Analítica */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-primary/10">
                    <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground group cursor-help" title="Compara la suma total de las ventas procesadas hasta hoy contra la estimación matemática de lo que se venderá al finalizar el mes, basado en tu promedio diario actual.">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Acumulado vs Proyección
                            <Info className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={proyeccionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                                    <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                                    <YAxis type="category" dataKey="name" hide />
                                    <RechartsTooltip formatter={customTooltipFormatter} contentStyle={{ borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff' }} />
                                    <Legend />
                                    <Bar dataKey="Acumulado" stackId="a" fill="#3b82f6" radius={[4, 0, 0, 4]} />
                                    <Bar dataKey="Proyectado (Restante)" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-primary/10">
                    <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground group cursor-help" title="Se evalúan todos los lunes, martes, etc. del periodo consultado y se calcula el promedio de ventas de cada día para identificar los mejores días de la semana.">
                            <BarChartIcon className="h-4 w-4 text-primary" />
                            Rendimiento Semanal (Promedio)
                            <Info className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analisis_semanal} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(value) => `$${value}`} />
                                    <RechartsTooltip formatter={customTooltipFormatter} contentStyle={{ borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff' }} />
                                    <Line type="monotone" dataKey="promedio_monto" name="Monto Promedio" stroke="#ef4444" strokeWidth={3} dot={{ r: 6, fill: '#ef4444' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Análisis Semanal Tabla */}
            <Card className="shadow-lg border-primary/10 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-lg group cursor-help" title="Muestra el número promedio de tickets, el monto promedio generado y cuánto gasta cada cliente (Ticket Promedio por Persona) agrupado por día de la semana.">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Desglose y Rendimiento Semanal
                        <Info className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors ml-2" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Día</th>
                                    <th className="px-4 py-3 text-right">Promedio Cuentas</th>
                                    <th className="px-4 py-3 text-right">Monto Promedio</th>
                                    <th className="px-4 py-3 text-right">Ticket Prom. Persona</th>
                                    <th className="px-4 py-3 text-center">Muestras</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {analisis_semanal.map((dia: any, index: number) => (
                                    <tr key={index} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 font-bold text-foreground">
                                            {dia.dia}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {dia.promedio_tickets.toFixed(1)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-primary">
                                            ${dia.promedio_monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-500">
                                            ${dia.ticket_promedio_persona.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                            {dia.dias_contados} {dia.dias_contados === 1 ? 'día' : 'días'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
