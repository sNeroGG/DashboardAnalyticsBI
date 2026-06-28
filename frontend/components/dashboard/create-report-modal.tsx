import React from 'react'
import { X, FileText, CreditCard, Calendar, HelpCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportData } from '@/lib/types'

interface CreateReportModalProps {
    isOpen: boolean
    onClose: () => void
    reportData: ReportData | null
    dateFrom: string
    dateTo: string
    onGenerateReport: (
        type: 'summary' | 'products',
        scope: 'period' | 'day' | 'session',
        target: string | number | null,
        customDateFrom?: string,
        customDateTo?: string
    ) => Promise<void>
}

export function CreateReportModal({ isOpen, onClose, reportData, dateFrom, dateTo, onGenerateReport }: CreateReportModalProps) {
    const [reportType, setReportType] = React.useState<'summary' | 'products'>('summary')
    const [productsScope, setProductsScope] = React.useState<'period' | 'day' | 'session'>('period')
    const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null)
    
    // Calendar select states
    const [selectedDay, setSelectedDay] = React.useState<string>(dateTo)
    const [modifyPeriod, setModifyPeriod] = React.useState(false)
    const [customDateFrom, setCustomDateFrom] = React.useState<string>(dateFrom)
    const [customDateTo, setCustomDateTo] = React.useState<string>(dateTo)
    
    const [isGenerating, setIsGenerating] = React.useState(false)

    // Aggregate all sessions from reportData
    const sessions = React.useMemo(() => {
        const list: { id: number; name: string }[] = []
        if (reportData?.data) {
            reportData.data.forEach((day: any) => {
                if (day.sesiones) {
                    day.sesiones.forEach((s: any) => {
                        if (!list.some(item => item.id === s.id)) {
                            list.push({ id: s.id, name: s.name })
                        }
                    })
                }
            })
        }
        return list
    }, [reportData])

    // Set default selected session when sessions load
    React.useEffect(() => {
        if (sessions.length > 0 && selectedSessionId === null) {
            setSelectedSessionId(sessions[0].id)
        }
    }, [sessions, selectedSessionId])

    if (!isOpen) return null

    const handleConfirm = async () => {
        setIsGenerating(true)
        try {
            if (reportType === 'summary') {
                const from = modifyPeriod ? customDateFrom : dateFrom
                const to = modifyPeriod ? customDateTo : dateTo
                await onGenerateReport('summary', 'period', null, from, to)
            } else {
                if (productsScope === 'session') {
                    await onGenerateReport('products', 'session', selectedSessionId)
                } else if (productsScope === 'day') {
                    await onGenerateReport('products', 'day', selectedDay)
                } else {
                    const from = modifyPeriod ? customDateFrom : dateFrom
                    const to = modifyPeriod ? customDateTo : dateTo
                    await onGenerateReport('products', 'period', null, from, to)
                }
            }
            onClose()
        } catch (error) {
            console.error('Error generating report from modal', error)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                    <div>
                        <h3 className="text-xl font-black italic text-primary tracking-tight">Crear Reporte</h3>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Asistente de Impresión y Exportación</p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isGenerating}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 animate-in fade-in"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="mt-5 space-y-5">
                    {/* Active period info */}
                    <div className="flex flex-col gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3.5">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-primary uppercase tracking-widest">Periodo del Dashboard</p>
                                <p className="text-xs font-black text-foreground">
                                    {dateFrom} al {dateTo}
                                </p>
                            </div>
                        </div>

                        {/* Modify Period Toggle */}
                        <div className="flex items-center gap-2 border-t border-primary/10 pt-2.5">
                            <input
                                type="checkbox"
                                id="modify-period-checkbox"
                                checked={modifyPeriod}
                                onChange={(e) => setModifyPeriod(e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <label htmlFor="modify-period-checkbox" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                Evaluar un periodo diferente para este reporte
                            </label>
                        </div>

                        {/* Custom Dates Inputs */}
                        {modifyPeriod && (
                            <div className="grid grid-cols-2 gap-3 mt-1.5 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Desde</label>
                                    <input
                                        type="date"
                                        value={customDateFrom}
                                        onChange={(e) => setCustomDateFrom(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none text-foreground"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Hasta</label>
                                    <input
                                        type="date"
                                        value={customDateTo}
                                        onChange={(e) => setCustomDateTo(e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none text-foreground"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Report Type Select */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">1. Elegir Tipo de Reporte</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setReportType('summary')}
                                disabled={isGenerating}
                                className={`flex items-start gap-3.5 rounded-xl border-2 p-4 text-left transition-all ${
                                    reportType === 'summary'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <FileText className="h-6 w-6 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <span className="text-xs font-black uppercase tracking-widest block">Resumen General</span>
                                    <span className="text-[9px] leading-normal font-medium block text-muted-foreground">
                                        Métricas de ventas, métodos de pago netos y gráficos operacionales.
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => setReportType('products')}
                                disabled={isGenerating}
                                className={`flex items-start gap-3.5 rounded-xl border-2 p-4 text-left transition-all ${
                                    reportType === 'products'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <CreditCard className="h-6 w-6 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <span className="text-xs font-black uppercase tracking-widest block">Ventas por Producto</span>
                                    <span className="text-[9px] leading-normal font-medium block text-muted-foreground">
                                        Detalle de clientes, ventas agrupadas por categoría y flujo de fondos.
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-[9px] text-muted-foreground space-y-1">
                        <p className="font-bold uppercase tracking-wider text-[8.5px] text-foreground flex items-center gap-1.5">
                            <HelpCircle className="h-3 w-3 text-primary" /> ¿Qué se mostrará en el reporte?
                        </p>
                        <p className="leading-relaxed">
                            {reportType === 'summary' 
                                ? "Se imprimirá un resumen ejecutivo del flujo general de caja. Ideal para auditorías rápidas del rendimiento del local."
                                : "Se generará el desglose pormenorizado de platos/bebidas consumidas por categoría junto con el ticket promedio por cliente."
                            }
                        </p>
                    </div>

                    {/* Products Report Options */}
                    {reportType === 'products' && (
                        <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 animate-in slide-in-from-top-4 duration-300">
                            {/* Scope Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">2. Alcance del Reporte de Productos</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setProductsScope('period')}
                                        disabled={isGenerating}
                                        className={`flex-1 rounded-lg border py-2 text-center text-xs font-bold transition-all ${
                                            productsScope === 'period'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Periodo
                                    </button>
                                    <button
                                        onClick={() => setProductsScope('day')}
                                        disabled={isGenerating}
                                        className={`flex-1 rounded-lg border py-2 text-center text-xs font-bold transition-all ${
                                            productsScope === 'day'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Por Día
                                    </button>
                                    <button
                                        onClick={() => setProductsScope('session')}
                                        disabled={isGenerating}
                                        className={`flex-1 rounded-lg border py-2 text-center text-xs font-bold transition-all ${
                                            productsScope === 'session'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Por Sesión
                                    </button>
                                </div>
                            </div>

                            {/* Info Box based on scope */}
                            <div className="text-[9px] text-muted-foreground/80 font-medium">
                                {productsScope === 'period' && (
                                    <p>Se consolidarán los productos y clientes del rango: <span className="font-bold text-foreground">{modifyPeriod ? `${customDateFrom} al ${customDateTo}` : `${dateFrom} al ${dateTo}`}</span>.</p>
                                )}
                                {productsScope === 'day' && (
                                    <p>Selecciona un día específico mediante el calendario de abajo para evaluar las ventas de esa fecha.</p>
                                )}
                                {productsScope === 'session' && (
                                    <p>Elige una sesión de caja de Odoo específica de las sesiones abiertas en el periodo.</p>
                                )}
                            </div>

                            {/* Day Calendar Input */}
                            {productsScope === 'day' && (
                                <div className="space-y-1.5 animate-in fade-in duration-200">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-primary" /> Seleccionar Día
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(e.target.value)}
                                        disabled={isGenerating}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none text-foreground"
                                    />
                                </div>
                            )}

                            {/* Session Dropdown */}
                            {productsScope === 'session' && (
                                <div className="space-y-1.5 animate-in fade-in duration-200">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Seleccionar Sesión de Odoo</label>
                                    {sessions.length === 0 ? (
                                        <p className="text-xs italic text-amber-500 font-bold">No hay sesiones disponibles en este periodo.</p>
                                    ) : (
                                        <select
                                            value={selectedSessionId || ''}
                                            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                                            disabled={isGenerating}
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
                <div className="mt-6 flex items-end justify-end gap-3 border-t border-border/80 pt-4">
                    <Button variant="ghost" onClick={onClose} disabled={isGenerating} className="hover:bg-muted text-foreground">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={
                            isGenerating ||
                            (reportType === 'products' && productsScope === 'session' && !selectedSessionId) ||
                            (reportType === 'products' && productsScope === 'day' && !selectedDay)
                        }
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black flex items-center gap-2"
                    >
                        {isGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
                        {isGenerating ? 'Descargando de Odoo...' : 'Generar PDF'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
