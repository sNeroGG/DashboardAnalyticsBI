'use client'

import { useState, useEffect } from 'react'
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
import { dashboardAPI } from '@/lib/api'
import type { ReportData, Masters } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { LogOut, RefreshCcw, LayoutDashboard, Database, BarChart2, Users, ShoppingBag, Activity } from 'lucide-react'

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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'analitica' | 'comparativa' | 'users' | 'purchases'>('dashboard')
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
        fetchReport()
    }, [activeTab]) // Re-fetch or apply rules on tab change

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

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tighter italic">BI ANALYTICS <span className="text-primary font-normal not-italic">Odoo v1.6</span></h1>
                        <p className="text-sm text-muted-foreground font-medium">Panel de Control Estratégico Herradura</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
                    Ventas por Usuario
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
                onFetchReport={fetchReport}
                isLoading={isLoading}
            />

            {reportData && (activeTab !== 'comparativa' || compareReportData) ? (
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
                        <AdvancedAnalytics reportData={reportData} />
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
    )
}
