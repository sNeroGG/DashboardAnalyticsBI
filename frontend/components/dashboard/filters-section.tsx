import { useState, useRef, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Calendar, Users, CreditCard, Layers, ChevronDown, Filter, Target, Info } from 'lucide-react'
import type { Masters } from '@/lib/types'
import { format, addDays } from 'date-fns'

interface FiltersSectionProps {
    activeTab?: 'dashboard' | 'analitica' | 'comparativa' | 'users' | 'purchases'
    dateFrom: string
    dateTo: string
    compareDateFrom?: string
    compareDateTo?: string
    selectedUsers: number[]
    selectedPayments: number[]
    selectedProductGroups: string[]
    selectedStates: string[]
    masters: Masters | undefined
    odooStates: { id: string, name: string }[]
    onDateFromChange: (date: string) => void
    onDateToChange: (date: string) => void
    onCompareDateFromChange?: (date: string) => void
    onCompareDateToChange?: (date: string) => void
    onUsersChange: (users: number[]) => void
    onPaymentsChange: (payments: number[]) => void
    onProductGroupsChange: (groups: string[]) => void
    onStatesChange: (states: string[]) => void
    onFetchReport: () => void
    isLoading: boolean
}

export function FiltersSection({
    activeTab = 'dashboard',
    dateFrom,
    dateTo,
    compareDateFrom,
    compareDateTo,
    selectedUsers,
    selectedPayments,
    selectedProductGroups,
    selectedStates,
    masters,
    odooStates,
    onDateFromChange,
    onDateToChange,
    onCompareDateFromChange,
    onCompareDateToChange,
    onUsersChange,
    onPaymentsChange,
    onProductGroupsChange,
    onStatesChange,
    onFetchReport,
    isLoading,
}: FiltersSectionProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [queryMode, setQueryMode] = useState<'day' | 'month' | 'quarter' | 'year'>('month')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
    const [showAdvanced, setShowAdvanced] = useState(false)
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

    // Ensure advanced filters are hidden if not on dashboard
    useEffect(() => {
        if (activeTab !== 'dashboard') {
            setShowAdvanced(false)
            // also clear specific filters since we are hiding them and user shouldn't expect them to apply
            if (selectedUsers.length > 0) onUsersChange([])
            if (selectedPayments.length > 0) onPaymentsChange([])
            if (selectedStates.length > 0) onStatesChange([])
        }
    }, [activeTab])

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name)
    }

    const years = ['2023', '2024', '2025', '2026']
    const modes = [
        { id: 'day', name: 'Día Específico', icon: Target },
        { id: 'month', name: 'Mes Completo', icon: Calendar },
        { id: 'quarter', name: 'Trimestre (3 meses)', icon: Layers },
        { id: 'year', name: 'Año Completo', icon: Layers }
    ]

    const months = [
        { id: '01', name: 'Enero' }, { id: '02', name: 'Febrero' }, { id: '03', name: 'Marzo' },
        { id: '04', name: 'Abril' }, { id: '05', name: 'Mayo' }, { id: '06', name: 'Junio' },
        { id: '07', name: 'Julio' }, { id: '08', name: 'Agosto' }, { id: '09', name: 'Septiembre' },
        { id: '10', name: 'Octubre' }, { id: '11', name: 'Noviembre' }, { id: '12', name: 'Diciembre' }
    ]

    const handleSmartChange = (mode: 'day' | 'month' | 'quarter' | 'year', value: string) => {
        if (mode === 'year') {
            onDateFromChange(`${value}-01-01`)
            onDateToChange(`${value}-12-31`)
        } else if (mode === 'quarter') {
            const startMonth = parseInt(value)
            let endMonth = startMonth + 2
            let endYear = parseInt(selectedYear)
            
            if (endMonth > 12) {
                endMonth -= 12
                endYear += 1
            }
            
            const startStr = value.padStart(2, '0')
            const endStr = endMonth.toString().padStart(2, '0')
            const lastDay = new Date(endYear, endMonth, 0).getDate()
            
            onDateFromChange(`${selectedYear}-${startStr}-01`)
            onDateToChange(`${endYear}-${endStr}-${lastDay}`)
        } else if (mode === 'month') {
            const lastDay = new Date(parseInt(selectedYear), parseInt(value), 0).getDate()
            onDateFromChange(`${selectedYear}-${value}-01`)
            onDateToChange(`${selectedYear}-${value}-${lastDay}`)
        } else if (mode === 'day') {
            onDateFromChange(value)
            onDateToChange(value)
        }
    }

    const handleMonthInput = (value: string, isCompare = false) => {
        if (!value) return;
        const [y, m] = value.split('-')
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
        if (isCompare && onCompareDateFromChange && onCompareDateToChange) {
            onCompareDateFromChange(`${y}-${m}-01`)
            onCompareDateToChange(`${y}-${m}-${lastDay}`)
        } else {
            onDateFromChange(`${y}-${m}-01`)
            onDateToChange(`${y}-${m}-${lastDay}`)
        }
    }

    // Identificar mes o trimestre
    const currentMonthNum = dateFrom.split('-')[1]
    const currentMonthName = months.find(m => m.id === currentMonthNum)?.name
    
    // Calcular el mes final para el nombre del trimestre
    const toMonthNum = dateTo.split('-')[1]
    const toMonthName = months.find(m => m.id === toMonthNum)?.name

    const evaluationText = useMemo(() => {
        if (activeTab === 'comparativa') {
            const m1 = dateFrom.substring(0, 7)
            const m2 = compareDateFrom ? compareDateFrom.substring(0, 7) : ''
            return `Comparando el rendimiento entre ${m1} y ${m2}`
        }

        const fromD = new Date(dateFrom + 'T00:00:00')
        const toD = new Date(dateTo + 'T00:00:00')
        const df = format(fromD, 'dd/MM/yyyy')
        const dt = format(addDays(toD, 1), 'dd/MM/yyyy')

        let base = ''
        if (queryMode === 'day') {
            base = `Evaluando la jornada del ${df} (desde el ${df} 04:00 hasta el ${dt} 04:00)`
        } else if (queryMode === 'year') {
            base = `Evaluando todo el año ${selectedYear} (desde el ${df} 04:00 hasta el ${dt} 04:00)`
        } else if (queryMode === 'quarter') {
            base = `Evaluando el trimestre de ${currentMonthName} a ${toMonthName} (desde el ${df} 04:00 hasta el ${dt} 04:00)`
        } else {
            base = `Evaluando todo el mes de ${currentMonthName} (desde el ${df} 04:00 hasta el ${dt} 04:00)`
        }

        if (activeTab === 'users' || activeTab === 'dashboard') {
            if (selectedUsers.length > 0 && masters?.['res.users']) {
                const names = selectedUsers
                    .map(uid => masters['res.users'].find(u => u.id === uid)?.name)
                    .filter(Boolean)
                    .join(', ')
                base += ` • Del usuario(s): ${names}`
            }
        }
        
        return base
    }, [dateFrom, dateTo, queryMode, selectedYear, currentMonthName, selectedUsers, masters, activeTab])


    return (
        <Card className="border-2 shadow-2xl bg-card border-primary/20 overflow-visible">
            <CardContent className="p-5">
                <div className="flex flex-col gap-6" ref={dropdownRef}>
                    
                    {/* FILA 1: SELECTORES RÁPIDOS */}
                    {activeTab === 'comparativa' ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4 space-y-1.5 relative text-left">
                                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Mes Base (Mes 1)</Label>
                                <Input type="month" value={dateFrom.substring(0, 7)} onChange={(e) => handleMonthInput(e.target.value, false)} className="h-10 text-xs font-bold border-primary [color-scheme:dark]" />
                            </div>
                            <div className="md:col-span-4 space-y-1.5 relative text-left">
                                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Mes a Comparar (Mes 2)</Label>
                                <Input type="month" value={compareDateFrom ? compareDateFrom.substring(0, 7) : ''} onChange={(e) => handleMonthInput(e.target.value, true)} className="h-10 text-xs font-bold border-primary [color-scheme:dark]" />
                            </div>
                            <div className="md:col-span-4 pl-2 pt-1 items-end flex h-10 w-full">
                                <Button onClick={(e) => { e.preventDefault(); onFetchReport(); }} disabled={isLoading || !compareDateFrom} className="w-full h-full bg-primary hover:bg-primary/90 text-white font-black rounded shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-xs italic tracking-widest uppercase">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Comparar</>}
                                </Button>
                            </div>
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        
                        {/* 1. MODO */}
                        <div className="md:col-span-2 space-y-1.5 relative text-left">
                            <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Consulta por</Label>
                            <div onClick={() => toggleDropdown('mode')} className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs hover:border-primary transition-all">
                                <span className="font-semibold flex items-center gap-2">
                                    {modes.find(m => m.id === queryMode)?.name}
                                </span>
                                <ChevronDown className="h-3 w-3" />
                            </div>
                            {openDropdown === 'mode' && (
                                <div className="absolute z-[70] mt-1 w-full bg-popover border border-border rounded-md shadow-2xl p-1">
                                    {modes.map(m => (
                                        <div key={m.id} onClick={() => { setQueryMode(m.id as any); setOpenDropdown(null); }} className="px-3 py-2 text-xs hover:bg-primary/10 rounded cursor-pointer">{m.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. AÑO */}
                        <div className="md:col-span-2 space-y-1.5 relative text-left">
                            <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Año</Label>
                            <div onClick={() => toggleDropdown('year')} className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs hover:border-primary transition-all">
                                <span className="font-bold">{selectedYear}</span>
                                <ChevronDown className="h-3 w-3" />
                            </div>
                            {openDropdown === 'year' && (
                                <div className="absolute z-[70] mt-1 w-full bg-popover border border-border rounded-md shadow-2xl p-1">
                                    {years.map(y => (
                                        <div key={y} onClick={() => { setSelectedYear(y); if (queryMode === 'year') handleSmartChange('year', y); setOpenDropdown(null); }} className="px-3 py-2 text-xs hover:bg-primary/10 rounded cursor-pointer">{y}</div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. DINAMICO (MES O DIA) */}
                        <div className="md:col-span-3 space-y-1.5 relative text-left">
                            {queryMode === 'month' && (
                                <>
                                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Mes a evaluar</Label>
                                    <div onClick={() => toggleDropdown('month')} className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border-2 border-primary bg-primary/5 px-3 py-2 text-xs hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">
                                        <span className="font-black text-primary text-sm uppercase">
                                            {currentMonthName ? `${currentMonthName} ${selectedYear}` : '--- SELECCIONA MES ---'}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-primary" />
                                    </div>
                                    {openDropdown === 'month' && (
                                        <div className="absolute z-[70] mt-1 w-full grid grid-cols-4 gap-1 bg-popover border border-border rounded-md shadow-2xl p-2">
                                            {months.map(m => (
                                                <div key={m.id} onClick={() => { handleSmartChange('month', m.id); setOpenDropdown(null); }} className={`px-2 py-3 text-[9px] text-center rounded transition-all cursor-pointer border border-border/40 font-bold ${currentMonthNum === m.id ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}>{m.name.toUpperCase()}</div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {queryMode === 'day' && (
                                <>
                                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Día Específico</Label>
                                    <Input type="date" value={dateFrom} onChange={(e) => handleSmartChange('day', e.target.value)} className="h-10 text-xs font-bold border-primary" />
                                </>
                            )}
                            {queryMode === 'quarter' && (
                                <>
                                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Escoge el primer mes del trimestre</Label>
                                    <div onClick={() => toggleDropdown('quarter')} className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border-2 border-primary bg-primary/5 px-3 py-2 text-xs hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">
                                        <span className="font-black text-primary text-sm uppercase">
                                            {currentMonthName ? `${currentMonthName} a ${toMonthName}` : '--- SELECCIONA PRIMER MES ---'}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-primary" />
                                    </div>
                                    {openDropdown === 'quarter' && (
                                        <div className="absolute z-[70] mt-1 w-full grid grid-cols-4 gap-1 bg-popover border border-border rounded-md shadow-2xl p-2">
                                            {months.map(m => (
                                                <div key={m.id} onClick={() => { handleSmartChange('quarter', m.id); setOpenDropdown(null); }} className={`px-2 py-3 text-[9px] text-center rounded transition-all cursor-pointer border border-border/40 font-bold ${currentMonthNum === m.id ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}>{m.name.toUpperCase()}</div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                             {queryMode === 'year' && (
                                <>
                                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest pl-1">Reporte Anual</Label>
                                    <div className="h-10 flex items-center px-3 bg-primary/20 border border-primary/30 rounded text-xs font-black italic text-primary">TODO EL AÑO {selectedYear} SELECCIONADO</div>
                                </>
                            )}
                        </div>

                        {/* 4. BOTON CONSULTAR */}
                        <div className="md:col-span-3 pl-2 pt-1 items-end flex h-10 w-full">
                            <Button onClick={(e) => { e.preventDefault(); onFetchReport(); }} disabled={isLoading} className="w-full h-full bg-primary hover:bg-primary/90 text-white font-black rounded shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-xs italic tracking-widest uppercase">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Consultar</>}
                            </Button>
                        </div>
                        
                        {/* 5. TOGGLE FILTROS AVANZADOS (SOLO EN DASHBOARD) */}
                        {activeTab === 'dashboard' && (
                            <div className="md:col-span-2 pt-1 items-end flex h-10 w-full">
                                <Button 
                                    variant={showAdvanced ? "default" : "outline"}
                                    onClick={() => setShowAdvanced(!showAdvanced)} 
                                    className="w-full h-full text-xs font-bold gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    {showAdvanced ? "Ocultar" : "Avanzados"}
                                </Button>
                            </div>
                        )}
                    </div>
                    )}

                    {/* FILA 2: FILTROS AVANZADOS (DROPDOWNS) */}
                    {activeTab === 'dashboard' && showAdvanced && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className="h-px w-full bg-border/40 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                                <div className="space-y-1.5 relative">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Usuarios / Cajeros</Label>
                                    <div onClick={() => toggleDropdown('users')} className={`flex h-9 w-full cursor-pointer items-center justify-between rounded border px-3 py-2 text-[10px] ${selectedUsers.length > 0 ? 'border-primary bg-primary/5' : 'bg-background'}`}>
                                        <span className="truncate">{selectedUsers.length > 0 ? `${selectedUsers.length} Seleccionados` : 'Todos los Usuarios'}</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </div>
                                    {openDropdown === 'users' && (
                                        <div className="absolute z-50 mt-1 max-h-48 w-60 overflow-auto rounded border bg-popover p-1 shadow-2xl">
                                            {masters?.['res.users']?.map(user => (
                                                <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-accent text-[10px]">
                                                    <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => onUsersChange(selectedUsers.includes(user.id) ? selectedUsers.filter(id => id !== user.id) : [...selectedUsers, user.id])} className="h-3 w-3" />
                                                    <span className="truncate">{user.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 relative">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Métodos de Pago</Label>
                                    <div onClick={() => toggleDropdown('payments')} className={`flex h-9 w-full cursor-pointer items-center justify-between rounded border px-3 py-2 text-[10px] ${selectedPayments.length > 0 ? 'border-primary bg-primary/5' : 'bg-background'}`}>
                                        <span className="truncate">{selectedPayments.length > 0 ? `${selectedPayments.length} Seleccionados` : 'Filtro de Pago'}</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </div>
                                    {openDropdown === 'payments' && (
                                        <div className="absolute z-50 mt-1 max-h-48 w-56 overflow-auto rounded border bg-popover p-1 shadow-2xl">
                                            {masters?.['pos.payment.method']?.map(pm => (
                                                <label key={pm.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-accent text-[10px]">
                                                    <input type="checkbox" checked={selectedPayments.includes(pm.id)} onChange={() => onPaymentsChange(selectedPayments.includes(pm.id) ? selectedPayments.filter(id => id !== pm.id) : [...selectedPayments, pm.id])} className="h-3 w-3" />
                                                    <span className="truncate">{pm.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 relative">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Estado de Venta</Label>
                                    <div onClick={() => toggleDropdown('states')} className={`flex h-9 w-full cursor-pointer items-center justify-between rounded border px-3 py-2 text-[10px] ${selectedStates.length > 0 ? 'border-blue-500 bg-blue-500/5' : 'bg-background'}`}>
                                        <span className="truncate">{selectedStates.length > 0 ? `Ventas: (${selectedStates.length})` : 'Ventas OK'}</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </div>
                                    {openDropdown === 'states' && (
                                        <div className="absolute z-50 mt-1 w-48 bg-popover border border-border rounded shadow-2xl p-1 right-0 lg:left-0 text-[10px]">
                                            {odooStates.map(s => (
                                                <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer">
                                                    <input type="checkbox" checked={selectedStates.includes(s.id)} onChange={() => onStatesChange(selectedStates.includes(s.id) ? selectedStates.filter(x => x !== s.id) : [...selectedStates, s.id])} />
                                                    {s.name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex h-9 items-end justify-end px-2 italic text-[9px] text-muted-foreground/50">
                                    * Filtros avanzados integrados por AI
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* EVALUATION TEXT */}
                    <div className="flex items-center gap-2 justify-center text-xs font-medium text-muted-foreground bg-muted/20 py-2 rounded-md border border-border/30">
                        <Info className="h-4 w-4 text-primary" />
                        <span>{evaluationText}</span>
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}
