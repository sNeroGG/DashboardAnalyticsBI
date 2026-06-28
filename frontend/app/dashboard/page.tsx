'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth } from 'date-fns'
import { FiltersSection } from '@/components/dashboard/filters-section'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { DataTable } from '@/components/dashboard/data-table'
import { PaymentMethods } from '@/components/dashboard/report-tabs'
import { UserCharts } from '@/components/dashboard/user-charts'
import { UserTable } from '@/components/dashboard/user-table'
import { AdvancedAnalytics } from '@/components/dashboard/advanced-analytics'
import { MonthComparison } from '@/components/dashboard/month-comparison'
import { PrintSummary } from '@/components/dashboard/print-summary'
import { PrintActiveSessionsSummary } from '@/components/dashboard/print-active-sessions-summary'
import { ActiveSessionView } from '@/components/dashboard/active-session-view'
import { CreateReportModal } from '@/components/dashboard/create-report-modal'
import { PrintSalesReport } from '@/components/dashboard/print-sales-report'
import { dashboardAPI } from '@/lib/api'
import type { ReportData, Masters, ActiveSession } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { LogOut, RefreshCcw, LayoutDashboard, Database, BarChart2, Users, ShoppingBag, Activity, FileText, Clock, Loader2 } from 'lucide-react'

export default function DashboardPage() {
    const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [selectedUsers, setSelectedUsers] = useState<number[]>([])
    const [selectedPayments, setSelectedPayments] = useState<number[]>([])
    const [selectedProductGroups, setSelectedProductGroups] = useState<string[]>([])
    const [selectedStates, setSelectedStates] = useState<string[]>([])
    const [compareDateFrom, setCompareDateFrom] = useState('')
    const [compareDateTo, setCompareDateTo] = useState('')
    const [compareReportData, setCompareReportData] = useState<ReportData | null>(null)
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [masters, setMasters] = useState<Masters | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [isForcingRefresh, setIsForcingRefresh] = useState(false)
    const [activeTab, setActiveTab] = useState<'dashboard' | 'analitica' | 'active_session' | 'comparativa' | 'users' | 'purchases'>('dashboard')

    // Active Sessions state
    const [activeSessions, setActiveSessions] = useState<ActiveSession[] | null>(null)
    const [isActiveSession, setIsActiveSession] = useState(true)
    const [isActiveSessionLoading, setIsActiveSessionLoading] = useState(false)
    const [selectedActiveSessionIds, setSelectedActiveSessionIds] = useState<number[]>([])
    const [selectedActiveStates, setSelectedActiveStates] = useState<string[]>(['draft', 'paid', 'done', 'invoiced', 'cancel'])

    // Report modal and print states
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [printLayout, setPrintLayout] = useState<'summary' | 'sales_report'>('summary')
    const [printReportScope, setPrintReportScope] = useState<'period' | 'day' | 'session'>('period')
    const [printReportTarget, setPrintReportTarget] = useState<string | number | null>(null)
    const [tempPrintData, setTempPrintData] = useState<ReportData | null>(null)
    const [isPrintLoading, setIsPrintLoading] = useState(false)
    const [printDateFrom, setPrintDateFrom] = useState(dateFrom)
    const [printDateTo, setPrintDateTo] = useState(dateTo)
    const [isReadyToPrint, setIsReadyToPrint] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

    // Analitica tab states
    const [analiticaDateFrom, setAnaliticaDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00"))
    const [analiticaDateTo, setAnaliticaDateTo] = useState(format(new Date(), "yyyy-MM-dd'T'23:59"))
    const [analiticaReportData, setAnaliticaReportData] = useState<ReportData | null>(null)
    const [isAnaliticaLoading, setIsAnaliticaLoading] = useState(false)

    const router = useRouter()

    const odooStates = [
        { id: 'draft', name: 'Borrador' },
        { id: 'paid', name: 'Pagado' },
        { id: 'done', name: 'Publicado' },
        { id: 'invoiced', name: 'Facturado' },
        { id: 'cancel', name: 'Cancelado' }
    ]

    useEffect(() => {
        const token = localStorage.getItem('bi_token')
        if (!token) {
            router.push('/login')
            return
        }

        loadMasters()
        if (activeTab === 'active_session') {
            fetchActiveSessions()
        } else if (activeTab === 'analitica') {
            if (!analiticaReportData) {
                fetchAnaliticaReport()
            }
        } else {
            fetchReport()
        }
    }, [activeTab]) // Re-fetch or apply rules on tab change

    useEffect(() => {
        if (isReadyToPrint) {
            const originalTitle = document.title
            
            // Set print title
            let targetName = 'Periodo'
            const activeData = tempPrintData || reportData
            if (printReportScope === 'session' && printReportTarget !== null) {
                let foundName = ''
                if (activeData?.data) {
                    for (const day of activeData.data) {
                        const found = day.sesiones?.find((s: any) => s.id === Number(printReportTarget))
                        if (found) {
                            foundName = found.name
                            break
                        }
                    }
                }
                targetName = foundName || `Sesion ${printReportTarget}`
            } else if (printReportScope === 'day' && printReportTarget !== null) {
                targetName = String(printReportTarget)
            } else {
                targetName = `${printDateFrom} al ${printDateTo}`
            }
            
            document.title = printLayout === 'summary'
                ? `Resumen General - Herra - ${targetName}`
                : `Reporte de Ventas por Producto - Herra - ${targetName}`

            const timer = setTimeout(() => {
                window.print()
                document.title = originalTitle // RESTORE TITLE
                setIsReadyToPrint(false)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [isReadyToPrint, printLayout, printReportScope, printReportTarget, printDateFrom, printDateTo, tempPrintData, reportData])

    const fetchAnaliticaReport = async () => {
        setIsAnaliticaLoading(true)
        try {
            const fromTimestamp = analiticaDateFrom.replace('T', ' ') + ':00'
            const toTimestamp = analiticaDateTo.replace('T', ' ') + ':59'
            
            const { data } = await dashboardAPI.getReportVentas({
                date_from: fromTimestamp,
                date_to: toTimestamp,
                users: [],
                payments: [],
                groups: [],
                states: []
            })
            setAnaliticaReportData(data)
        } catch (error) {
            console.error('Error fetching analytics report', error)
        } finally {
            setIsAnaliticaLoading(false)
        }
    }

    const fetchActiveSessions = async () => {
        setIsActiveSessionLoading(true)
        try {
            const { data } = await dashboardAPI.getActiveSessions()
            if (data.status === 'success') {
                const sessionsList = data.sessions || []
                setActiveSessions(sessionsList)
                setIsActiveSession(data.is_active ?? true)
                setSelectedActiveSessionIds(sessionsList.map((s: any) => s.id))
            } else {
                setActiveSessions([])
                setIsActiveSession(true)
                setSelectedActiveSessionIds([])
            }
        } catch (error) {
            console.error('Error fetching active sessions', error)
            setActiveSessions([])
            setIsActiveSession(true)
            setSelectedActiveSessionIds([])
        } finally {
            setIsActiveSessionLoading(false)
        }
    }

    const loadMasters = async () => {
        try {
            const { data } = await dashboardAPI.getMasters()
            setMasters(data)
        } catch (error) {
            console.error('Error loading masters', error)
        }
    }


    const fetchReport = async (force = false) => {
        setIsLoading(true)
        try {
            const payloadBase = {
                date_from: dateFrom,
                date_to: dateTo,
                users: activeTab === 'dashboard' || activeTab === 'users' ? selectedUsers : [],
                payments: activeTab === 'dashboard' ? selectedPayments : [],
                groups: activeTab === 'dashboard' ? selectedProductGroups : [],
                states: activeTab === 'dashboard' ? selectedStates : [],
                force_refresh: force || isForcingRefresh
            }

            if (activeTab === 'comparativa') {
                if (!compareDateFrom || !compareDateTo) return; // Prevent fetch if compare dates are not set yet
                const payloadCompare = {
                    date_from: compareDateFrom,
                    date_to: compareDateTo,
                    users: [],
                    payments: [],
                    groups: [],
                    states: [],
                    force_refresh: force || isForcingRefresh
                }
                const [baseRes, compareRes] = await Promise.all([
                    dashboardAPI.getReportVentas(payloadBase),
                    dashboardAPI.getReportVentas(payloadCompare)
                ])
                setReportData(baseRes.data)
                setCompareReportData(compareRes.data)
            } else {
                const { data } = await dashboardAPI.getReportVentas(payloadBase)
                setReportData(data)
            }

            if (force) console.log('Reporte actualizado desde Odoo')
            setLastSyncTime(new Date())
        } catch (error) {
            console.error('Error fetching report', error)
        } finally {
            setIsLoading(false)
            setIsForcingRefresh(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('bi_token')
        router.push('/login')
    }

    const handleGenerateReport = async (
        type: 'summary' | 'products',
        scope: 'period' | 'day' | 'session',
        target: string | number | null,
        customDateFrom?: string,
        customDateTo?: string
    ) => {
        let fetchFrom = dateFrom
        let fetchTo = dateTo

        if (scope === 'day' && target !== null) {
            fetchFrom = String(target)
            fetchTo = String(target)
        } else if (customDateFrom && customDateTo) {
            fetchFrom = customDateFrom
            fetchTo = customDateTo
        }

        let fetchedReportData = reportData
        // Si el periodo/día es diferente al del dashboard actual, cargamos en segundo plano
        const hasCustomPeriod = (customDateFrom && customDateFrom !== dateFrom) || (customDateTo && customDateTo !== dateTo)
        if (scope === 'day' || hasCustomPeriod) {
            setIsPrintLoading(true)
            try {
                const queryFrom = scope === 'day' ? `${target} 00:00:00` : `${customDateFrom} 00:00:00`
                const queryTo = scope === 'day' ? `${target} 23:59:59` : `${customDateTo} 23:59:59`
                
                const { data } = await dashboardAPI.getReportVentas({
                    date_from: queryFrom,
                    date_to: queryTo,
                    users: [],
                    payments: [],
                    groups: [],
                    states: []
                })
                fetchedReportData = data
                setTempPrintData(data)
            } catch (error) {
                console.error("Error fetching print report data", error)
            } finally {
                setIsPrintLoading(false)
            }
        } else {
            setTempPrintData(null)
        }

        // Establecer tipo de layout, alcance y fechas reales de impresión
        setPrintLayout(type === 'summary' ? 'summary' : 'sales_report')
        setPrintReportScope(scope)
        setPrintReportTarget(target)
        setPrintDateFrom(fetchFrom)
        setPrintDateTo(fetchTo)

        const originalTitle = document.title
        let targetName = 'Periodo'
        if (scope === 'session' && target !== null) {
            let foundName = ''
            if (fetchedReportData?.data) {
                for (const day of fetchedReportData.data) {
                    const found = day.sesiones?.find((s: any) => s.id === Number(target))
                    if (found) {
                        foundName = found.name
                        break
                    }
                }
            }
            targetName = foundName || `Sesion ${target}`
        } else if (scope === 'day' && target !== null) {
            targetName = String(target)
        } else {
            targetName = `${fetchFrom} al ${fetchTo}`
        }

        document.title = type === 'summary'
            ? `Resumen General - Herra - ${targetName}`
            : `Reporte de Ventas por Producto - Herra - ${targetName}`

        // Activar la señal de impresión para el useEffect
        setIsReadyToPrint(true)

        // Esperar a que se complete el flujo de impresión (se restaure el título) para resolver el modal
        return new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                if (!isReadyToPrint) {
                    clearInterval(checkInterval)
                    // Limpiar datos temporales después de imprimir
                    setTimeout(() => {
                        setTempPrintData(null)
                    }, 500)
                    resolve()
                }
            }, 200)

            // Por seguridad, resolver después de 10 segundos
            setTimeout(() => {
                clearInterval(checkInterval)
                setTempPrintData(null)
                resolve()
            }, 10000)
        })
    }

    const handleActiveSessionPrint = () => {
        const originalTitle = document.title
        const dateStr = format(new Date(), 'yyyy-MM-dd')
        document.title = isActiveSession
            ? `Sesiones Activas - Herra - ${dateStr}`
            : `Ultimas Sesiones Activas - Herra - ${dateStr}`

        setTimeout(() => {
            window.print()
            setTimeout(() => {
                document.title = originalTitle
            }, 500)
        }, 150)
    }

    const filteredActiveSessions = useMemo(() => {
        if (!activeSessions) return []
        
        const matchedSessions = activeSessions.filter(s => 
            selectedActiveSessionIds.includes(s.id)
        )
        
        return matchedSessions.map(s => ({
            ...s,
            cuentas: (s.cuentas || []).filter(c => 
                selectedActiveStates.includes(c.estado || '')
            )
        }))
    }, [activeSessions, selectedActiveSessionIds, selectedActiveStates])

    const isInitialLoading = !masters || (isLoading && !reportData && activeTab !== 'active_session') || (isActiveSessionLoading && !activeSessions && activeTab === 'active_session')

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative flex items-center justify-center">
                        {/* Outer rotating ring */}
                        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        {/* Inner glowing circle */}
                        <div className="absolute h-8 w-8 rounded-full bg-primary/10 animate-ping" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-black italic text-primary tracking-tighter uppercase animate-pulse">
                            BI Analytics Odoo
                        </h2>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                            Cargando datos del sistema...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 animate-in fade-in duration-500 print:hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                            <LayoutDashboard className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tighter italic">BI ANALYTICS <span className="text-primary font-normal not-italic">Odoo v2.1</span></h1>
                            <p className="text-sm text-muted-foreground font-medium">Panel de Control Estratégico Herradura</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {reportData && (
                            <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(true)} className="gap-2 border-primary/20 hover:bg-primary/10">
                                <FileText className="h-4 w-4" />
                                Crear Reporte
                            </Button>
                        )}
                        {lastSyncTime && (
                            <span className="text-[10px] text-muted-foreground font-medium hidden md:inline bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/50">
                                Última sinc: <span className="font-bold text-foreground">{format(lastSyncTime, 'dd/MM/yyyy HH:mm:ss')}</span>
                            </span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => fetchReport(true)} className="gap-2 border-primary/20 hover:bg-primary/10">
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Sincronizar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            Salir
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-2 border-b border-border/50 pb-2 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <BarChart2 className="h-4 w-4" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('analitica')}
                        className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'analitica' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <Activity className="h-4 w-4" />
                        Analitica
                    </button>
                    <button
                        onClick={() => setActiveTab('active_session')}
                        className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'active_session' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <Clock className="h-4 w-4" />
                        Sesión Activa
                    </button>
                    <button
                        onClick={() => setActiveTab('comparativa')}
                        className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'comparativa' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <BarChart2 className="h-4 w-4" />
                        Comparativa
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <Users className="h-4 w-4" />
                        Ventas por Vendedor
                    </button>
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'purchases' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Compras por proveedor
                    </button>
                </div>

                {/* Filters */}
                {activeTab !== 'active_session' && (
                    <FiltersSection
                        activeTab={activeTab}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        compareDateFrom={compareDateFrom}
                        compareDateTo={compareDateTo}
                        selectedUsers={selectedUsers}
                        selectedPayments={selectedPayments}
                        selectedProductGroups={selectedProductGroups}
                        selectedStates={selectedStates}
                        masters={masters}
                        odooStates={odooStates}
                        onDateFromChange={setDateFrom}
                        onDateToChange={setDateTo}
                        onCompareDateFromChange={setCompareDateFrom}
                        onCompareDateToChange={setCompareDateTo}
                        onUsersChange={setSelectedUsers}
                        onPaymentsChange={setSelectedPayments}
                        onProductGroupsChange={setSelectedProductGroups}
                        onStatesChange={setSelectedStates}
                        onFetchReport={() => fetchReport(true)}
                        isLoading={isLoading}
                        reportData={reportData || undefined}
                    />
                )}

                {activeTab === 'active_session' ? (
                    <ActiveSessionView 
                        sessions={activeSessions} 
                        filteredSessions={filteredActiveSessions}
                        isActive={isActiveSession}
                        isLoading={isActiveSessionLoading} 
                        onRefresh={fetchActiveSessions} 
                        onPrint={handleActiveSessionPrint}
                        selectedSessionIds={selectedActiveSessionIds}
                        onSelectedSessionIdsChange={setSelectedActiveSessionIds}
                        selectedStates={selectedActiveStates}
                        onSelectedStatesChange={setSelectedActiveStates}
                    />
                ) : reportData && (activeTab !== 'comparativa' || compareReportData) ? (
                    <>
                        {/* DASHBOARD TAB CONTENT */}
                        {activeTab === 'dashboard' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <StatsCards data={reportData.data || []} />

                                <div className="flex flex-col gap-8">
                                    <div className="w-full">
                                        <ChartsSection data={reportData.data || []} />
                                    </div>
                                    <div className="w-full">
                                        <PaymentMethods
                                            reportData={reportData}
                                            masters={masters!}
                                            selectedPayments={selectedPayments}
                                        />
                                    </div>
                                </div>

                                <DataTable data={reportData.data || []} />
                            </div>
                        )}

                        {/* ANALITICA TAB CONTENT */}
                        {activeTab === 'analitica' && (
                            <div className="space-y-6">
                                {/* Filtros por Timestamp */}
                                <div className="flex flex-col sm:flex-row items-end gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
                                    <div className="flex-1 space-y-1.5 w-full">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Desde (Timestamp)</label>
                                        <input 
                                            type="datetime-local" 
                                            value={analiticaDateFrom} 
                                            onChange={(e) => setAnaliticaDateFrom(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none text-foreground"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5 w-full">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Hasta (Timestamp)</label>
                                        <input 
                                            type="datetime-local" 
                                            value={analiticaDateTo} 
                                            onChange={(e) => setAnaliticaDateTo(e.target.value)}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none text-foreground"
                                        />
                                    </div>
                                    <Button 
                                        onClick={fetchAnaliticaReport} 
                                        disabled={isAnaliticaLoading}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-9 px-6 rounded-lg w-full sm:w-auto"
                                    >
                                        {isAnaliticaLoading ? 'Cargando...' : 'Aplicar Rango'}
                                    </Button>
                                </div>

                                {isAnaliticaLoading && !analiticaReportData ? (
                                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/30">
                                        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                                        <p className="text-muted-foreground font-medium">Cargando métricas de analítica...</p>
                                    </div>
                                ) : (
                                    <AdvancedAnalytics reportData={analiticaReportData || reportData} />
                                )}
                            </div>
                        )}

                        {/* COMPARATIVA TAB CONTENT */}
                        {activeTab === 'comparativa' && compareReportData && (
                            <MonthComparison baseData={reportData} compareData={compareReportData} />
                        )}

                        {/* USERS TAB CONTENT */}
                        {activeTab === 'users' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="w-full">
                                    <UserCharts usuarios={reportData.usuarios || []} />
                                </div>
                                <div className="w-full">
                                    <UserTable usuarios={reportData.usuarios || []} />
                                </div>
                            </div>
                        )}

                        {/* PURCHASES TAB CONTENT */}
                        {activeTab === 'purchases' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/30">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">Sección en Construcción</h3>
                                <p className="text-muted-foreground font-medium">Las compras acumuladas por proveedor estarán disponibles pronto.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/30">
                        <Database className="h-12 w-12 text-muted-foreground animate-pulse mb-4" />
                        <p className="text-muted-foreground font-medium">Usa los filtros superiores para generar la consulta...</p>
                    </div>
                )}
            </div>
            {activeTab === 'active_session' && activeSessions ? (
                <div className="hidden print:block print-layout bg-white text-black p-4 w-full h-full text-[10px] font-sans">
                    <PrintActiveSessionsSummary sessions={activeSessions} isActive={isActiveSession} />
                </div>
            ) : printLayout === 'sales_report' && (tempPrintData || reportData) ? (
                <div className="hidden print:block print-layout bg-white text-black p-4 w-full h-full text-[10px] font-sans">
                    <PrintSalesReport 
                        reportData={tempPrintData || reportData} 
                        scope={printReportScope} 
                        target={printReportTarget} 
                        dateFrom={printDateFrom} 
                        dateTo={printDateTo} 
                    />
                </div>
            ) : (tempPrintData || reportData) ? (
                <div className="hidden print:block print-layout bg-white text-black p-4 w-full h-full text-[10px] font-sans">
                    <PrintSummary reportData={tempPrintData || reportData} dateFrom={printDateFrom} dateTo={printDateTo} />
                </div>
            ) : null}

            <CreateReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportData={reportData}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onGenerateReport={handleGenerateReport}
            />

            {isPrintLoading && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-primary px-5 py-3 rounded-2xl text-primary-foreground shadow-2xl animate-bounce border-2 border-primary-foreground/20 print:hidden">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest animate-pulse">Descargando reporte de Odoo...</span>
                </div>
            )}
        </>
    )
}
