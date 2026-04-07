'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '@/lib/api'
import { format, startOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { FiltersSection } from '@/components/dashboard/filters-section'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { ReportTabs } from '@/components/dashboard/report-tabs'
import type { ReportPayload } from '@/lib/types'

export default function DashboardPage() {
    const router = useRouter()
    const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [selectedUsers, setSelectedUsers] = useState<number[]>([])
    const [selectedPayments, setSelectedPayments] = useState<number[]>([])
    const [selectedProductGroups, setSelectedProductGroups] = useState<string[]>([])
    const [submittedFilters, setSubmittedFilters] = useState({
        dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        dateTo: format(new Date(), 'yyyy-MM-dd'),
        users: [] as number[],
        payments: [] as number[],
        groups: [] as string[]
    })
    const [shouldFetchReport, setShouldFetchReport] = useState(false)

    // Load masters (users, payment methods)
    const { data: masters, isLoading: mastersLoading } = useQuery({
        queryKey: ['masters'],
        queryFn: async () => {
            const response = await dashboardAPI.getMasters()
            return response.data
        },
    })

    // Load report data
    const { data: reportData, isLoading: reportLoading, refetch } = useQuery({
        queryKey: ['report', submittedFilters],
        queryFn: async () => {
            const payload: ReportPayload = {
                date_from: `${submittedFilters.dateFrom} 00:00:00`,
                date_to: `${submittedFilters.dateTo} 23:59:59`,
                users: submittedFilters.users.length > 0 ? submittedFilters.users : undefined,
                payment_methods: submittedFilters.payments.length > 0 ? submittedFilters.payments : undefined,
                product_groups: submittedFilters.groups.length > 0 ? submittedFilters.groups : undefined,
                force_refresh: false,
            }
            const response = await dashboardAPI.getReportVentas(payload)
            return response.data
        },
        enabled: shouldFetchReport,
    })

    // Auto-fetch on mount
    useEffect(() => {
        if (masters) {
            setShouldFetchReport(true)
        }
    }, [masters])

    const handleLogout = () => {
        localStorage.removeItem('bi_token')
        router.push('/login')
    }

    const handleFetchReport = () => {
        setSubmittedFilters({
            dateFrom,
            dateTo,
            users: selectedUsers,
            payments: selectedPayments,
            groups: selectedProductGroups
        })
        setShouldFetchReport(true)
    }

    if (mastersLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <nav className="border-b bg-card">
                <div className="container mx-auto flex items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-2">
                            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-primary">BI ANALYTICS</h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Salir
                    </Button>
                </div>
            </nav>

            <div className="container mx-auto p-4 space-y-6">
                {/* Filters */}
                <FiltersSection
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    selectedUsers={selectedUsers}
                    selectedPayments={selectedPayments}
                    selectedProductGroups={selectedProductGroups}
                    masters={masters}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onUsersChange={setSelectedUsers}
                    onPaymentsChange={setSelectedPayments}
                    onProductGroupsChange={setSelectedProductGroups}
                    onFetchReport={handleFetchReport}
                    isLoading={reportLoading}
                />

                {/* Stats Cards */}
                {reportData && <StatsCards data={reportData.data || []} />}

                {/* Charts */}
                {reportData && <ChartsSection data={reportData.data || []} />}

                {/* Table / Tabs */}
                {reportData && <ReportTabs reportData={reportData} masters={masters} selectedPayments={submittedFilters.payments} />}
            </div>
        </div>
    )
}
