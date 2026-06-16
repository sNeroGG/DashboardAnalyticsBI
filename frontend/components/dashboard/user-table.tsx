import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { OdooTooltip } from '@/components/ui/odoo-tooltip'

interface UserTableProps {
    usuarios: any[]
}

export function UserTable({ usuarios = [] }: UserTableProps) {
    return (
        <Card>
            <CardHeader>
                <OdooTooltip model="pos.order" field="order_creator_id, order_creator_name" filter="Vendedor que creó el pedido en el punto de venta de Odoo. Tiene fallback al campo user_id (cajero)." className="w-fit">
                    <CardTitle className="flex items-center gap-2 cursor-help">
                        <Users className="h-5 w-5" />
                        Despliegue de Vendedores / Cajeros
                    </CardTitle>
                </OdooTooltip>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-sm font-semibold">Vendedor / Cajero</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Cuentas Cobradas</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Ventas Acumuladas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u: any, idx: number) => (
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
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-muted-foreground">No hay datos de usuarios para este periodo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
