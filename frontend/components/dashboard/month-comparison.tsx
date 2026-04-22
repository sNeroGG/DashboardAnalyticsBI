import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, CalendarDays, Users, DollarSign, CreditCard, Activity, Trophy } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ReportData } from '@/lib/types'

interface MonthComparisonProps {
    baseData: ReportData
    compareData: ReportData
}

export function MonthComparison({ baseData, compareData }: MonthComparisonProps) {
    
    // Aggregation helper
    const sumField = (data: any[], field: string) => data.reduce((acc, curr) => acc + (curr[field] || 0), 0)

    // Get month names
    const getMonthName = (data: any[]) => {
        if (!data || data.length === 0) return ''
        const dateStr = data[0].fecha
        if (!dateStr) return ''
        const [y, m] = dateStr.split('-')
        const date = new Date(parseInt(y), parseInt(m) - 1, 1)
        return date.toLocaleString('es-ES', { month: 'long' }).toUpperCase()
    }
    const baseMonthName = getMonthName(baseData.data) || 'BASE'
    const compMonthName = getMonthName(compareData.data) || 'COMPARADO'

    // Totals
    const baseTotal = sumField(baseData.data, 'total_pagado')
    const compTotal = sumField(compareData.data, 'total_pagado')
    
    const basePropina = sumField(baseData.data, 'propina')
    const compPropina = sumField(compareData.data, 'propina')

    const baseCuentas = sumField(baseData.data, 'total_cuentas')
    const compCuentas = sumField(compareData.data, 'total_cuentas')

    // Best Day Helper
    const getBestDay = (data: any[]) => {
        if (!data || data.length === 0) return { fecha: 'N/A', total: 0 }
        return data.reduce((max, curr) => (curr.total_pagado > max.total_pagado ? curr : max), data[0])
    }
    
    const baseBestDay = getBestDay(baseData.data)
    const compBestDay = getBestDay(compareData.data)

    // Percentage change helper
    const getChange = (oldVal: number, newVal: number) => {
        if (oldVal === 0) return newVal > 0 ? 100 : 0
        return ((newVal - oldVal) / oldVal) * 100
    }

    const renderChangeBadge = (change: number) => {
        const isPos = change > 0
        const isZero = change === 0
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${isPos ? 'bg-green-500/20 text-green-500' : isZero ? 'bg-muted text-muted-foreground' : 'bg-red-500/20 text-red-500'}`}>
                {isPos ? <TrendingUp className="h-3 w-3" /> : isZero ? null : <TrendingDown className="h-3 w-3" />}
                {Math.abs(change).toFixed(2)}%
            </span>
        )
    }

    // Merge users for comparison
    const userMap: Record<string, { base: number, comp: number }> = {}
    baseData.usuarios?.forEach((u: any) => { userMap[u.nombre] = { base: u.ventas || 0, comp: 0 } })
    compareData.usuarios?.forEach((u: any) => {
        if (!userMap[u.nombre]) userMap[u.nombre] = { base: 0, comp: 0 }
        userMap[u.nombre].comp = u.ventas || 0
    })
    const mergedUsers = Object.entries(userMap).sort((a, b) => b[1].comp - a[1].comp)

    // Merge payments for comparison
    const payMap: Record<string, { base: number, comp: number }> = {}
    baseData.metodos?.forEach((p: any) => { payMap[p.metodo] = { base: p.monto || 0, comp: 0 } })
    compareData.metodos?.forEach((p: any) => {
        if (!payMap[p.metodo]) payMap[p.metodo] = { base: 0, comp: 0 }
        payMap[p.metodo].comp = p.monto || 0
    })
    const mergedPayments = Object.entries(payMap).sort((a, b) => b[1].comp - a[1].comp)

    // Chart Data Generation
    const chartData = []
    for (let i = 1; i <= 31; i++) {
        const dayStr = i.toString().padStart(2, '0')
        const baseDay = baseData.data?.find(d => d.fecha.endsWith(`-${dayStr}`))
        const compDay = compareData.data?.find(d => d.fecha.endsWith(`-${dayStr}`))
        
        if (baseDay || compDay) {
            chartData.push({
                dia: `Día ${i}`,
                [baseMonthName]: baseDay ? baseDay.total_pagado : 0,
                [compMonthName]: compDay ? compDay.total_pagado : 0
            })
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Global Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary shadow-lg bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Monto Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold truncate">Mes Base ({baseMonthName})</p>
                            <p className="text-xl font-black">${baseTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold truncate">Comparativa ({compMonthName})</p>
                            <p className="text-xl font-black text-primary">${compTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <div className="mt-1">{renderChangeBadge(getChange(baseTotal, compTotal))}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-lg bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-500" />
                            Propinas Totales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold truncate">Mes Base ({baseMonthName})</p>
                            <p className="text-xl font-black">${basePropina.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold truncate">Comparativa ({compMonthName})</p>
                            <p className="text-xl font-black text-green-500">${compPropina.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <div className="mt-1">{renderChangeBadge(getChange(basePropina, compPropina))}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-lg bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-amber-500" />
                            Total Cuentas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold truncate">Mes Base ({baseMonthName})</p>
                            <p className="text-xl font-black">{baseCuentas}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold truncate">Comparativa ({compMonthName})</p>
                            <p className="text-xl font-black text-amber-500">{compCuentas}</p>
                            <div className="mt-1">{renderChangeBadge(getChange(baseCuentas, compCuentas))}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Best Days Comparison */}
            <Card className="shadow-lg border-primary/10 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Récord: El Mejor Día
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl">
                        <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Mejor Día - {baseMonthName}</p>
                        <p className="text-2xl font-black text-foreground">{baseBestDay.fecha}</p>
                        <p className="text-3xl font-black text-primary mt-2">${(baseBestDay.total_pagado || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-primary/30 bg-primary/5 rounded-xl">
                        <p className="text-xs uppercase font-bold text-primary mb-2">Mejor Día - {compMonthName}</p>
                        <p className="text-2xl font-black text-foreground">{compBestDay.fecha}</p>
                        <p className="text-3xl font-black text-primary mt-2">${(compBestDay.total_pagado || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Income Comparison Chart */}
            <Card className="shadow-lg border-primary/10 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Curva de Ingresos ({baseMonthName} vs {compMonthName})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis 
                                    dataKey="dia" 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => `$${value}`} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey={baseMonthName} 
                                    name={baseMonthName}
                                    stroke="#64748b" 
                                    strokeWidth={3} 
                                    dot={{ r: 3, fill: "#64748b", strokeWidth: 0 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey={compMonthName} 
                                    name={compMonthName}
                                    stroke="#ef4444" 
                                    strokeWidth={3} 
                                    dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Breakdowns (Users & Payments) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Users Comparison */}
                <Card className="shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                            <Users className="h-5 w-5 text-primary" />
                            Rendimiento por Cajero/Usuario
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Usuario</th>
                                        <th className="px-4 py-3 text-right">{baseMonthName}</th>
                                        <th className="px-4 py-3 text-right">{compMonthName}</th>
                                        <th className="px-4 py-3 text-right">Crecimiento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {mergedUsers.map(([name, data]) => (
                                        <tr key={name} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-bold text-foreground truncate max-w-[150px]">{name}</td>
                                            <td className="px-4 py-3 text-right font-medium">${data.base.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-primary">${data.comp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 flex justify-end">
                                                {renderChangeBadge(getChange(data.base, data.comp))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Comparison */}
                <Card className="shadow-lg border-primary/10 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Rendimiento por Método de Pago
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Método</th>
                                        <th className="px-4 py-3 text-right">{baseMonthName}</th>
                                        <th className="px-4 py-3 text-right">{compMonthName}</th>
                                        <th className="px-4 py-3 text-right">Crecimiento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {mergedPayments.map(([name, data]) => (
                                        <tr key={name} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-bold text-foreground truncate max-w-[150px]">{name}</td>
                                            <td className="px-4 py-3 text-right font-medium">${data.base.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-primary">${data.comp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 flex justify-end">
                                                {renderChangeBadge(getChange(data.base, data.comp))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

            </div>

        </div>
    )
}
