import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { ReportRow } from '@/lib/types'
import { DollarSign, Receipt, Banknote, CreditCard } from 'lucide-react'
import { OdooTooltip } from '@/components/ui/odoo-tooltip'

interface StatsCardsProps {
    data: ReportRow[]
}

export function StatsCards({ data }: StatsCardsProps) {
    const totals = data.reduce(
        (acc, row) => ({
            paid: acc.paid + row.total_pagado,
            count: acc.count + row.total_cuentas,
            cash: acc.cash + row.restaurante_efectivo,
            card: acc.card + row.tarjeta,
        }),
        { paid: 0, count: 0, cash: 0, card: 0 }
    )

    const stats = [
        { label: 'Total Pagado', value: formatCurrency(totals.paid), icon: DollarSign, color: 'text-primary', tooltip: { model: 'pos.order', field: 'amount_total', filter: "Agrupado por ID de Sesión" } },
        { label: 'Transacciones', value: totals.count.toString(), icon: Receipt, color: 'text-green-500', tooltip: { model: 'pos.order', field: 'Conteo de Documentos (ID)', filter: "state != cancelado" } },
        { label: 'Efectivo', value: formatCurrency(totals.cash), icon: Banknote, color: 'text-blue-500', tooltip: { model: 'pos.order', field: 'Proporción Calculada', filter: "Efectivo (~35%)" } },
        { label: 'Tarjeta', value: formatCurrency(totals.card), icon: CreditCard, color: 'text-purple-500', tooltip: { model: 'pos.order', field: 'Proporción Calculada', filter: "Tarjeta (~65%)" } },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <OdooTooltip key={stat.label} model={stat.tooltip.model} field={stat.tooltip.field} filter={stat.tooltip.filter} className="w-full">
                    <Card className="border-2 hover:border-primary/50 transition-colors w-full h-full">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                                </div>
                                <stat.icon className={`h-10 w-10 ${stat.color} opacity-70`} />
                            </div>
                        </CardContent>
                    </Card>
                </OdooTooltip>
            ))}
        </div>
    )
}
