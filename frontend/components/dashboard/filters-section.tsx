import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Calendar, Users, CreditCard, Layers, ChevronDown } from 'lucide-react'
import type { Masters } from '@/lib/types'

interface FiltersSectionProps {
    dateFrom: string
    dateTo: string
    selectedUsers: number[]
    selectedPayments: number[]
    selectedProductGroups: string[]
    masters: Masters | undefined
    onDateFromChange: (date: string) => void
    onDateToChange: (date: string) => void
    onUsersChange: (users: number[]) => void
    onPaymentsChange: (payments: number[]) => void
    onProductGroupsChange: (groups: string[]) => void
    onFetchReport: () => void
    isLoading: boolean
}

export function FiltersSection({
    dateFrom,
    dateTo,
    selectedUsers,
    selectedPayments,
    selectedProductGroups,
    masters,
    onDateFromChange,
    onDateToChange,
    onUsersChange,
    onPaymentsChange,
    onProductGroupsChange,
    onFetchReport,
    isLoading,
}: FiltersSectionProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleUserSelect = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            onUsersChange(selectedUsers.filter(id => id !== userId))
        } else {
            onUsersChange([...selectedUsers, userId])
        }
    }

    const handlePaymentSelect = (pmId: number) => {
        if (selectedPayments.includes(pmId)) {
            onPaymentsChange(selectedPayments.filter(id => id !== pmId))
        } else {
            onPaymentsChange([...selectedPayments, pmId])
        }
    }

    const handleProductGroupSelect = (group: string) => {
        if (selectedProductGroups.includes(group)) {
            onProductGroupsChange(selectedProductGroups.filter(g => g !== group))
        } else {
            onProductGroupsChange([...selectedProductGroups, group])
        }
    }

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name)
    }

    // Mapping for product groups to readable names
    const productGroupLabels: Record<string, string> = {
        'food': 'Alimentos',
        'drink': 'Bebidas',
        'tip': 'Propina',
        'other': 'Otros'
    }

    const productGroups = ['food', 'drink', 'tip', 'other']

    return (
        <Card className="border-2 shadow-lg bg-card">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Search className="h-5 w-5" />
                    Filtros de Búsqueda
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6" ref={dropdownRef}>
                    {/* First Row: Dates */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="date-from" className="flex items-center gap-2 text-card-foreground/80 font-semibold">
                                <Calendar className="h-4 w-4 text-primary" />
                                Desde
                            </Label>
                            <Input
                                id="date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => onDateFromChange(e.target.value)}
                                className="bg-background border-input focus:ring-primary h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date-to" className="flex items-center gap-2 text-card-foreground/80 font-semibold">
                                <Calendar className="h-4 w-4 text-primary" />
                                Hasta
                            </Label>
                            <Input
                                id="date-to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => onDateToChange(e.target.value)}
                                className="bg-background border-input focus:ring-primary h-10"
                            />
                        </div>
                    </div>

                    {/* Second Row: Selectors and Button */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                        {/* Users Selector */}
                        <div className="space-y-2 relative">
                            <Label className="flex items-center gap-2 text-card-foreground/80 font-semibold">
                                <Users className="h-4 w-4 text-primary" />
                                Usuarios ({selectedUsers.length})
                            </Label>
                            <div
                                onClick={() => toggleDropdown('users')}
                                className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-all hover:border-primary hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <span className="truncate max-w-[150px]">
                                    {selectedUsers.length > 0 ? `${selectedUsers.length} seleccionados` : 'Todos los Usuarios'}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'users' ? 'rotate-180' : ''} opacity-60`} />
                            </div>
                            {openDropdown === 'users' && (
                                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                                    {masters?.['res.users']?.map((user) => (
                                        <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-sm transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleUserSelect(user.id);
                                                }}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                                            />
                                            <span className="truncate group-hover:font-medium">{user.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Methods Selector */}
                        <div className="space-y-2 relative">
                            <Label className="flex items-center gap-2 text-card-foreground/80 font-semibold">
                                <CreditCard className="h-4 w-4 text-primary" />
                                Método Pago ({selectedPayments.length})
                            </Label>
                            <div
                                onClick={() => toggleDropdown('payments')}
                                className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-all hover:border-primary hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <span className="truncate max-w-[150px]">
                                    {selectedPayments.length > 0 ? `${selectedPayments.length} seleccionados` : 'Todos los Métodos'}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'payments' ? 'rotate-180' : ''} opacity-60`} />
                            </div>
                            {openDropdown === 'payments' && (
                                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                                    {masters?.['pos.payment.method']?.map((pm) => (
                                        <label key={pm.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-sm transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={selectedPayments.includes(pm.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handlePaymentSelect(pm.id);
                                                }}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                                            />
                                            <span className="truncate group-hover:font-medium">{pm.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Groups Selector */}
                        <div className="space-y-2 relative">
                            <Label className="flex items-center gap-2 text-card-foreground/80 font-semibold">
                                <Layers className="h-4 w-4 text-primary" />
                                Categoría ({selectedProductGroups.length})
                            </Label>
                            <div
                                onClick={() => toggleDropdown('groups')}
                                className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-all hover:border-primary hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <span className="truncate max-w-[150px]">
                                    {selectedProductGroups.length > 0 ? `${selectedProductGroups.length} seleccionadas` : 'Todas las Categorías'}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'groups' ? 'rotate-180' : ''} opacity-60`} />
                            </div>
                            {openDropdown === 'groups' && (
                                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                                    {productGroups.map((group) => (
                                        <label key={group} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-sm transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={selectedProductGroups.includes(group)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleProductGroupSelect(group);
                                                }}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                                            />
                                            <span className="truncate group-hover:font-medium">{productGroupLabels[group] || group}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search Button */}
                        <div className="flex items-end h-10 mt-6 lg:mt-0">
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onFetchReport();
                                }}
                                disabled={isLoading}
                                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Calculando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-5 w-5" />
                                        CONSULTAR
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
