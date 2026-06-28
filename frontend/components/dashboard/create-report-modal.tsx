import React from 'react'
import { X, FileText, CreditCard, Calendar, HelpCircle, Loader2, Eye, CheckCircle2 } from 'lucide-react'
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
                            let formattedDate = ''
                            if (day.fecha) {
                                const parts = day.fecha.split('-')
                                if (parts.length === 3) {
                                    formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
                                } else {
                                    formattedDate = day.fecha
                                }
                            }
                            const cleanedName = s.name.replace(/^SESION\s+/i, '').replace(/"/g, '').trim()
                            const displayName = formattedDate ? `sesion ${cleanedName}/${formattedDate}` : `sesion ${cleanedName}`
                            list.push({ id: s.id, name: displayName })
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
            // Cerrar el modal primero para asegurar que se desmonte de la pantalla antes de la impresión
            onClose()

            // Ejecutar el generador en el siguiente tick del event loop
            setTimeout(async () => {
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
                } catch (error) {
                    console.error('Error generating report inside timeout', error)
                }
            }, 50)
        } catch (error) {
            console.error('Error generating report from modal', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const formatDateString = (dateStr: string) => {
        if (!dateStr) return ''
        const parts = dateStr.split('-')
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`
        }
        return dateStr
    }

    // Determine the review date text
    let displayEvalDate = ''
    if (reportType === 'summary') {
        displayEvalDate = modifyPeriod 
            ? `${formatDateString(customDateFrom)} al ${formatDateString(customDateTo)}` 
            : `${formatDateString(dateFrom)} al ${formatDateString(dateTo)}`
    } else {
        if (productsScope === 'day') {
            displayEvalDate = formatDateString(selectedDay)
        } else if (productsScope === 'session') {
            const foundSess = sessions.find(s => s.id === selectedSessionId)
            displayEvalDate = foundSess ? foundSess.name : `Sesión ID: ${selectedSessionId}`
        } else {
            displayEvalDate = modifyPeriod 
                ? `${formatDateString(customDateFrom)} al ${formatDateString(customDateTo)}` 
                : `${formatDateString(dateFrom)} al ${formatDateString(dateTo)}`
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
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
                    {/* SELECT REPORT TYPE */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            Tipo de Reporte a Exportar
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setReportType('summary')}
                                disabled={isGenerating}
                                className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                                    reportType === 'summary'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black uppercase tracking-widest block">Reporte de Ventas</span>
                                    <span className="text-[8.5px] leading-normal font-medium block text-muted-foreground">
                                        Métricas de ventas, gráficos y métodos de pago consolidado.
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => setReportType('products')}
                                disabled={isGenerating}
                                className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                                    reportType === 'products'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <CreditCard className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black uppercase tracking-widest block">Ventas por Producto</span>
                                    <span className="text-[8.5px] leading-normal font-medium block text-muted-foreground">
                                        Detalle de clientes y consumo agrupado por categorías de platos.
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* DATES / SCOPE CONFIGURATION */}
                    <div className="space-y-3 bg-muted/20 border border-border p-4 rounded-xl">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            Fechas y Alcance de Evaluación
                        </label>
                        
                        {/* Scope for products report */}
                        {reportType === 'products' && (
                            <div className="space-y-2 border-b border-border/80 pb-3">
                                <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Alcance del Reporte</label>
                                <div className="flex gap-2">
                                    {['period', 'day', 'session'].map((sc) => (
                                        <button
                                            key={sc}
                                            onClick={() => setProductsScope(sc as any)}
                                            disabled={isGenerating}
                                            className={`flex-1 rounded-lg border py-1.5 text-center text-xs font-bold transition-all uppercase tracking-wider text-[9px] ${
                                                productsScope === sc
                                                    ? 'border-primary bg-primary/10 text-primary font-black'
                                                    : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {sc === 'period' ? 'Periodo' : sc === 'day' ? 'Por Día' : 'Por Sesión'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Calendar Day Picker */}
                        {reportType === 'products' && productsScope === 'day' && (
                            <div className="space-y-1.5 animate-in fade-in duration-200">
                                <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary" /> Día a Evaluar
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

                        {/* Session Selection */}
                        {reportType === 'products' && productsScope === 'session' && (
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

                        {/* Normal / Custom Period select */}
                        {(reportType === 'summary' || (reportType === 'products' && productsScope === 'period')) && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="modify-period-checkbox-modal"
                                        checked={modifyPeriod}
                                        onChange={(e) => setModifyPeriod(e.target.checked)}
                                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                    />
                                    <label htmlFor="modify-period-checkbox-modal" className="text-[9px] font-black uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                        Modificar fechas de periodo a evaluar
                                    </label>
                                </div>

                                {modifyPeriod ? (
                                    <div className="grid grid-cols-2 gap-3 pt-1.5 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Desde</label>
                                            <input
                                                type="date"
                                                value={customDateFrom}
                                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Hasta</label>
                                            <input
                                                type="date"
                                                value={customDateTo}
                                                onChange={(e) => setCustomDateTo(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs font-bold text-foreground bg-background border border-border/80 rounded-lg p-2.5 flex items-center justify-between">
                                        <span className="text-muted-foreground text-[10px] font-black uppercase tracking-wider">Fechas del Dashboard:</span>
                                        <span>{formatDateString(dateFrom)} al {formatDateString(dateTo)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* REVIEW PARAMETERS CARD */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Estructura de Exportación
                        </label>
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div>
                                <span className="text-muted-foreground font-black block text-[8.5px] uppercase tracking-wider">Reporte</span>
                                <span className="font-black text-foreground uppercase tracking-wide">
                                    {reportType === 'summary' ? 'Reporte de Ventas' : 'Ventas por Producto'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground font-black block text-[8.5px] uppercase tracking-wider">
                                    {reportType === 'summary' 
                                        ? 'Periodo Evaluado' 
                                        : productsScope === 'session' 
                                            ? 'Sesión Evaluada' 
                                            : productsScope === 'day' 
                                                ? 'Día Evaluado' 
                                                : 'Periodo Evaluado'
                                    }
                                </span>
                                <span className="font-black text-foreground italic">{displayEvalDate}</span>
                            </div>
                        </div>
                    </div>
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
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black flex items-center gap-2 text-xs uppercase tracking-wider px-5 py-2.5 h-10"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Descargando...
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4" />
                                Revisar y Generar PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
