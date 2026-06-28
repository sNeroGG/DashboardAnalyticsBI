import React from 'react'
import { X, FileText, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportData } from '@/lib/types'

interface CreateReportModalProps {
    isOpen: boolean
    onClose: () => void
    reportData: ReportData | null
    onPrintSummary: () => void
    onPrintSalesReport: (scope: 'period' | 'day' | 'session', target: string | number | null) => void
}

export function CreateReportModal({ isOpen, onClose, reportData, onPrintSummary, onPrintSalesReport }: CreateReportModalProps) {
    const [reportType, setReportType] = React.useState<'summary' | 'products'>('summary')
    const [productsScope, setProductsScope] = React.useState<'period' | 'day' | 'session'>('period')
    const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null)
    const [selectedDay, setSelectedDay] = React.useState<string | null>(null)

    // Aggregate all sessions from reportData
    const sessions = React.useMemo(() => {
        const list: { id: number; name: string }[] = []
        if (reportData?.data) {
            reportData.data.forEach((day: any) => {
                if (day.sesiones) {
                    day.sesiones.forEach((s: any) => {
                        // Evitar duplicados
                        if (!list.some(item => item.id === s.id)) {
                            list.push({ id: s.id, name: s.name })
                        }
                    })
                }
            })
        }
        return list
    }, [reportData])

    // Aggregate all loaded days from reportData
    const daysList = React.useMemo(() => {
        if (!reportData?.data) return []
        return reportData.data.map((day: any) => day.fecha).sort()
    }, [reportData])

    // Set default selected session when sessions load
    React.useEffect(() => {
        if (sessions.length > 0 && selectedSessionId === null) {
            setSelectedSessionId(sessions[0].id)
        }
    }, [sessions, selectedSessionId])

    // Set default selected day when days load
    React.useEffect(() => {
        if (daysList.length > 0 && selectedDay === null) {
            setSelectedDay(daysList[0])
        }
    }, [daysList, selectedDay])

    if (!isOpen) return null

    const handleConfirm = () => {
        if (reportType === 'summary') {
            onPrintSummary()
        } else {
            if (productsScope === 'session') {
                onPrintSalesReport('session', selectedSessionId)
            } else if (productsScope === 'day') {
                onPrintSalesReport('day', selectedDay)
            } else {
                onPrintSalesReport('period', null)
            }
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                    <h3 className="text-xl font-black italic text-primary tracking-tight">Crear Reporte</h3>
                    <button 
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="mt-6 space-y-6">
                    {/* Report Type Select */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Tipo de Reporte</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setReportType('summary')}
                                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all ${
                                    reportType === 'summary'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <FileText className="h-6 w-6" />
                                <span className="text-xs font-bold uppercase tracking-widest mt-2">Resumen Periodo</span>
                            </button>
                            <button
                                onClick={() => setReportType('products')}
                                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all ${
                                    reportType === 'products'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <CreditCard className="h-6 w-6" />
                                <span className="text-xs font-bold uppercase tracking-widest mt-2">Ventas por Producto</span>
                            </button>
                        </div>
                    </div>

                    {/* Products Report Options */}
                    {reportType === 'products' && (
                        <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 animate-in slide-in-from-top-4 duration-300">
                            {/* Scope Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Alcance del Reporte</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setProductsScope('period')}
                                        className={`flex-1 rounded-lg border py-1.5 text-center text-xs font-bold transition-all ${
                                            productsScope === 'period'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Periodo
                                    </button>
                                    <button
                                        onClick={() => setProductsScope('day')}
                                        className={`flex-1 rounded-lg border py-1.5 text-center text-xs font-bold transition-all ${
                                            productsScope === 'day'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Por Día
                                    </button>
                                    <button
                                        onClick={() => setProductsScope('session')}
                                        className={`flex-1 rounded-lg border py-1.5 text-center text-xs font-bold transition-all ${
                                            productsScope === 'session'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Por Sesión
                                    </button>
                                </div>
                            </div>

                            {/* Day Dropdown */}
                            {productsScope === 'day' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Seleccionar Día</label>
                                    {daysList.length === 0 ? (
                                        <p className="text-xs italic text-amber-500 font-bold">No hay días disponibles en este periodo.</p>
                                    ) : (
                                        <select
                                            value={selectedDay || ''}
                                            onChange={(e) => setSelectedDay(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none text-foreground"
                                        >
                                            {daysList.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Session Dropdown */}
                            {productsScope === 'session' && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Seleccionar Sesión</label>
                                    {sessions.length === 0 ? (
                                        <p className="text-xs italic text-amber-500 font-bold">No hay sesiones disponibles en este periodo.</p>
                                    ) : (
                                        <select
                                            value={selectedSessionId || ''}
                                            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none text-foreground"
                                        >
                                            {sessions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 flex items-end justify-end gap-3 border-t border-border/80 pt-4">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-muted text-foreground">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={
                            (reportType === 'products' && productsScope === 'session' && !selectedSessionId) ||
                            (reportType === 'products' && productsScope === 'day' && !selectedDay)
                        }
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black"
                    >
                        Generar PDF
                    </Button>
                </div>
            </div>
        </div>
    )
}
