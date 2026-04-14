'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth } from 'date-fns'
import { FiltersSection } from '@/components/dashboard/filters-section'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { DataTable } from '@/components/dashboard/data-table'
import { ReportTabs } from '@/components/dashboard/report-tabs'
import { dashboardAPI } from '@/lib/api'
import type { ReportData, Masters } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { LogOut, RefreshCcw, LayoutDashboard, Database, Filter } from 'lucide-react'

export default function DashboardPage() {
    const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [selectedUsers, setSelectedUsers] = useState<number[]>([])
    const [selectedPayments, setSelectedPayments] = useState<number[]>([])
    const [selectedProductGroups, setSelectedProductGroups] = useState<string[]>([])
    const [selectedStates, setSelectedStates] = useState<string[]>([])
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [masters, setMasters] = useState<Masters | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [isForcingRefresh, setIsForcingRefresh] = useState(false)
    const [viewMode, setViewMode] = useState<'main' | 'advanced'>('main')
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
    }, [viewMode])

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
            const { data } = await dashboardAPI.getReportVentas({
                date_from: dateFrom,
                date_to: dateTo,
                users: viewMode === 'advanced' ? selectedUsers : [],
                payments: viewMode === 'advanced' ? selectedPayments : [],
                groups: viewMode === 'advanced' ? selectedProductGroups : [],
                states: viewMode === 'advanced' ? selectedStates : [],
                force_refresh: force || isForcingRefresh
            })
            setReportData(data)
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
                        <h1 className="text-3xl font-black text-foreground tracking-tighter italic">BI ANALYTICS <span className="text-primary font-normal not-italic">Odoo v1.0</span></h1>
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
            <div className="flex space-x-2 border-b border-border/50 pb-2">
                <button
                    onClick={() => setViewMode('main')}
                    className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md ${viewMode === 'main' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                >
                    Dashboard General
                </button>
                <button
                    onClick={() => setViewMode('advanced')}
                    className={`px-4 py-2 text-sm font-bold tracking-widest uppercase transition-colors rounded-t-md flex items-center gap-2 ${viewMode === 'advanced' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                >
                    <Filter className="h-4 w-4" />
                    Análisis Avanzado
                </button>
            </div>

            {/* Filters */}
            <FiltersSection
                viewMode={viewMode}
                dateFrom={dateFrom}
                dateTo={dateTo}
                selectedUsers={selectedUsers}
                selectedPayments={selectedPayments}
                selectedProductGroups={selectedProductGroups}
                selectedStates={selectedStates}
                masters={masters}
                odooStates={odooStates}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onUsersChange={setSelectedUsers}
                onPaymentsChange={setSelectedPayments}
                onProductGroupsChange={setSelectedProductGroups}
                onStatesChange={setSelectedStates}
                onFetchReport={fetchReport}
                isLoading={isLoading}
            />

            {reportData ? (
                <>
                    <StatsCards data={reportData.data} />
                    
                    <div className="flex flex-col gap-8">
                        <div className="w-full">
                            <ChartsSection data={reportData.data} />
                        </div>
                        <div className="w-full">
                             <ReportTabs 
                                reportData={reportData} 
                                masters={masters!} 
                                selectedPayments={selectedPayments}
                             />
                        </div>
                    </div>

                    <DataTable data={reportData.data} />
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
