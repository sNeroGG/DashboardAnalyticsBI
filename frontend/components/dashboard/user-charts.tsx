import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface UserChartsProps {
    usuarios: any[]
}

export function UserCharts({ usuarios = [] }: UserChartsProps) {
    const dataVentas = [...usuarios].sort((a, b) => b.ventas - a.ventas)
    const dataCuentas = [...usuarios].sort((a, b) => b.cuentas - a.cuentas)

    if (usuarios.length === 0) {
        return (
            <Card>
                <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No hay datos de usuarios para graficar en este periodo.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Ingresos por Cajero
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={dataVentas} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                                dataKey="nombre" 
                                stroke="#fff" 
                                fontSize={10} 
                                angle={-45} 
                                textAnchor="end" 
                                interval={0}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <YAxis 
                                stroke="#fff" 
                                fontSize={10}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#16213e', border: '1px solid #16a085', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                            />
                            <Bar 
                                dataKey="ventas" 
                                name="Monto Facturado"
                                radius={[4, 4, 0, 0]}
                            >
                                {dataVentas.map((entry, index) => (
                                    <Cell key={`cell-ventas-${index}`} fill={'#16a085'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Cuentas Operadas (Volumen)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={dataCuentas} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                                dataKey="nombre" 
                                stroke="#fff" 
                                fontSize={10} 
                                angle={-45} 
                                textAnchor="end" 
                                interval={0}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <YAxis 
                                stroke="#fff" 
                                fontSize={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#16213e', border: '1px solid #e94560', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [value, 'Cuentas']}
                            />
                            <Bar 
                                dataKey="cuentas" 
                                name="No. Cuentas"
                                radius={[4, 4, 0, 0]}
                            >
                                {dataCuentas.map((entry, index) => (
                                    <Cell key={`cell-cuentas-${index}`} fill={'#e94560'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
