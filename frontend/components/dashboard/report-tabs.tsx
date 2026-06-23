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
    let metodosCalculados: { id: number | null; metodo: string; monto: number }[] = []
    if (metodosMaestros.length > 0) {
        metodosCalculados = metodosMaestros.map(m => {
            // Encontrar lo que devolvió el backend para este método
            const backP = reportData.metodos?.find((row: any) => {
                if (!row.metodo) return false;
                const rowMetodoLower = String(row.metodo).toLowerCase();
                const mNameLower = String(m.name).toLowerCase();
                return (
                    rowMetodoLower === mNameLower ||
                    rowMetodoLower.includes(mNameLower) ||
                    mNameLower.includes(rowMetodoLower) ||
                    row.metodo === `Metodo ${m.id}` ||
                    row.metodo === String(m.id)
                );
            })
            // Si el usuario aplicó filtros y el método NO ESTÁ en el filtro, forzamos a 0
            let monto = backP ? backP.monto : 0

            // Regla estricta: Si hay selección en el filtro y ESTE método no fue seleccionado, forzamos a 0
            if (selectedPayments.length > 0 && !selectedPayments.includes(m.id)) {
                monto = 0
            }

            return {
                id: m.id,
                metodo: m.name,
                monto: monto
            }
        })
    } else {
        // Robust Fallback: Usar los métodos devueltos por el backend si no hay maestros cargados
        metodosCalculados = (reportData.metodos || []).map((row: any) => {
            let displayMetodo = row.metodo
            let matchedId: number | null = null

            if (row.id !== undefined && row.id !== null) {
                matchedId = Number(row.id)
            } else if (row.metodo && row.metodo.startsWith('Metodo ')) {
                const idStr = row.metodo.substring(7)
                matchedId = parseInt(idStr, 10)
            }

            const matchedMaster = masters?.['pos.payment.method']?.find(m => String(m.id) === String(matchedId))
            if (matchedMaster) {
                displayMetodo = matchedMaster.name
            }

            if (selectedPayments.length > 0 && matchedId !== null && !selectedPayments.includes(matchedId)) {
                return null
            }

            return {
                id: matchedId,
                metodo: displayMetodo,
                monto: row.monto
            }
        }).filter(Boolean) as any[]
    }

    // Sort all calculated methods by amount descending
    metodosCalculados.sort((a, b) => b.monto - a.monto)

    // Categorization logic
    const getCategory = (metodo: string, id: number | null) => {
        const nameLower = (metodo || '').toLowerCase().trim();

        // 1. Check for Tarjeta (Card) keywords or ID 2
        const normalized = nameLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (
            normalized.includes('tarjeta') ||
            normalized.includes('card') ||
            normalized.includes('pos') ||
            normalized.includes('credito') ||
            normalized.includes('debito') ||
            nameLower === 'metodo 2' ||
            nameLower === '2' ||
            id === 2
        ) {
            return 'tarjeta';
        }

        // 2. Check for Efectivo (Cash) keywords
        if (normalized.includes('efectivo')) {
            return 'efectivo';
        }

        // 3. If it's a fallback placeholder name (e.g. "metodo 4", "metodo 5", "4", "5")
        // we classify it as 'efectivo' because the backend treats everything except ID 2
        // as Cash (restaurante_efectivo).
        const isPlaceholder = nameLower.startsWith('metodo') || /^\d+$/.test(nameLower);
        if (isPlaceholder) {
            return 'efectivo';
        }

        // 4. Any other specific name goes to Otros
        return 'otros';
    }

    const grupoEfectivo = metodosCalculados.filter(m => getCategory(m.metodo, m.id) === 'efectivo')
    const grupoTarjeta = metodosCalculados.filter(m => getCategory(m.metodo, m.id) === 'tarjeta')
    const grupoOtros = metodosCalculados.filter(m => getCategory(m.metodo, m.id) === 'otros')

    const totalEfectivo = grupoEfectivo.reduce((sum, m) => sum + m.monto, 0)
    const totalTarjeta = grupoTarjeta.reduce((sum, m) => sum + m.monto, 0)
    const totalOtros = grupoOtros.reduce((sum, m) => sum + m.monto, 0)


    return (
        <Card className="border-2 border-primary/20 shadow-2xl">
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Cantidad por Efectivo y Tarjeta
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="overflow-x-auto">
                    <table className="w-full max-w-2xl mx-auto border-collapse">
                        <thead>
                            <tr className="border-b border-border/80">
                                <th className="px-4 py-3 text-left text-xs font-black tracking-wider uppercase text-muted-foreground">Categoría / Método</th>
                                <th className="px-4 py-3 text-right text-xs font-black tracking-wider uppercase text-muted-foreground">Monto Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Grupo Efectivo */}
                            <tr className="bg-primary/5 border-b border-primary/10">
                                <td className="px-4 py-2.5 text-xs font-black text-primary flex items-center gap-2 uppercase tracking-wider">
                                    <span>💵</span> Efectivo
                                </td>
                                <td className="px-4 py-2.5 text-right text-xs font-black text-primary">
                                    {formatCurrency(totalEfectivo)}
                                </td>
                            </tr>
                            {grupoEfectivo.length === 0 ? (
                                <tr className="border-b border-border/20">
                                    <td className="pl-10 pr-4 py-2 text-xs italic text-muted-foreground/60">No hay registros de efectivo</td>
                                    <td className="px-4 py-2 text-right text-xs italic text-slate-600">{formatCurrency(0)}</td>
                                </tr>
                            ) : (
                                grupoEfectivo.map((m, idx) => (
                                    <tr key={`efectivo-${idx}`} className="border-b border-border/20 hover:bg-muted/40 transition-colors">
                                        <td className="pl-10 pr-4 py-2 text-xs font-medium text-slate-300">
                                            {m.metodo}
                                        </td>
                                        <td className={`px-4 py-2 text-right text-xs font-bold ${m.monto > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {formatCurrency(m.monto)}
                                        </td>
                                    </tr>
                                ))
                            )}

                            {/* Grupo Tarjeta */}
                            <tr className="bg-primary/5 border-b border-primary/10 mt-2">
                                <td className="px-4 py-2.5 text-xs font-black text-primary flex items-center gap-2 uppercase tracking-wider">
                                    <span>💳</span> Tarjeta
                                </td>
                                <td className="px-4 py-2.5 text-right text-xs font-black text-primary">
                                    {formatCurrency(totalTarjeta)}
                                </td>
                            </tr>
                            {grupoTarjeta.length === 0 ? (
                                <tr className="border-b border-border/20">
                                    <td className="pl-10 pr-4 py-2 text-xs italic text-muted-foreground/60">No hay registros de tarjeta</td>
                                    <td className="px-4 py-2 text-right text-xs italic text-slate-600">{formatCurrency(0)}</td>
                                </tr>
                            ) : (
                                grupoTarjeta.map((m, idx) => (
                                    <tr key={`tarjeta-${idx}`} className="border-b border-border/20 hover:bg-muted/40 transition-colors">
                                        <td className="pl-10 pr-4 py-2 text-xs font-medium text-slate-300">
                                            {m.metodo}
                                        </td>
                                        <td className={`px-4 py-2 text-right text-xs font-bold ${m.monto > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {formatCurrency(m.monto)}
                                        </td>
                                    </tr>
                                ))
                            )}

                            {/* Grupo Otros */}
                            <tr className="bg-primary/5 border-b border-primary/10 mt-2">
                                <td className="px-4 py-2.5 text-xs font-black text-primary flex items-center gap-2 uppercase tracking-wider">
                                    <span>⚙️</span> Otros
                                </td>
                                <td className="px-4 py-2.5 text-right text-xs font-black text-primary">
                                    {formatCurrency(totalOtros)}
                                </td>
                            </tr>
                            {grupoOtros.length === 0 ? (
                                <tr className="border-b border-border/20">
                                    <td className="pl-10 pr-4 py-2 text-xs italic text-muted-foreground/60">No hay otros registros</td>
                                    <td className="px-4 py-2 text-right text-xs italic text-slate-600">{formatCurrency(0)}</td>
                                </tr>
                            ) : (
                                grupoOtros.map((m, idx) => (
                                    <tr key={`otros-${idx}`} className="border-b border-border/20 hover:bg-muted/40 transition-colors">
                                        <td className="pl-10 pr-4 py-2 text-xs font-medium text-slate-300">
                                            {m.metodo}
                                        </td>
                                        <td className={`px-4 py-2 text-right text-xs font-bold ${m.monto > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {formatCurrency(m.monto)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
