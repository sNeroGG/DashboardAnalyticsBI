import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { ReportData, Masters } from '@/lib/types'
import { CreditCard } from 'lucide-react'

interface PaymentMethodsProps {
    reportData: ReportData
    masters: Masters
    selectedPayments: number[]
}

export function PaymentMethods({ reportData, masters, selectedPayments }: PaymentMethodsProps) {
    // Mapear los métodos de la API de Masters
    const metodosMaestros = masters?.['pos.payment.method'] || []

    // Cruzar métodos retornados con los maestros para asegurar los $0
    const metodosCalculados = metodosMaestros.map(m => {
        // Encontrar lo que devolvió el backend para este método
        const backP = reportData.metodos?.find((row: any) => row.metodo === m.name)
        // Si el usuario aplicó filtros y el método NO ESTÁ en el filtro, forzamos a 0
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
    )
}
