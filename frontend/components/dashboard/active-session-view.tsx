'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { ActiveSession } from '@/lib/types'
import { Loader2, ChevronDown, ChevronRight, RefreshCcw, Clock, User, AlertCircle, FileText } from 'lucide-react'

interface ActiveSessionViewProps {
    sessions: ActiveSession[] | null
    isActive: boolean
    isLoading: boolean
    onRefresh: () => void
    onPrint: () => void
}

export function ActiveSessionView({ sessions, isActive, isLoading, onRefresh, onPrint }: ActiveSessionViewProps) {
    const [expandedSessions, setExpandedSessions] = useState<Record<number, boolean>>({})

    const toggleSession = (sessionId: number) => {
        setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }))
    }

    if (isLoading) {
        return (
            <Card className="border-2 border-primary/20 shadow-2xl">
                <CardContent className="py-24 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                        Descargando datos de sesiones desde Odoo...
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (!sessions || sessions.length === 0) {
        return (
            <Card className="border-2 border-amber-500/20 bg-amber-500/5 shadow-2xl">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
                    <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20 text-amber-500">
                        <AlertCircle className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic">
                            Sin Sesiones Registradas
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            No se encontraron sesiones abiertas ni cerradas recientemente en Odoo.
                        </p>
                    </div>
                    <Button 
                        onClick={onRefresh} 
                        variant="outline" 
                        className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold gap-2 text-xs uppercase"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Verificar Nuevamente
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!isActive) {
        return (
            <div className="space-y-6">
                {/* Alerta de que no hay sesiones activas */}
                <Card className="border-2 border-amber-500/20 bg-amber-500/5 shadow-2xl">
                    <CardContent className="py-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
                        <div className="bg-amber-500/10 p-3 rounded-full border border-amber-500/20 text-amber-500">
                            <AlertCircle className="h-8 w-8 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight italic">
                                Sin Sesiones Abiertas
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium">
                                No se encontraron sesiones abiertas en tiempo real (en vivo) en Odoo.
                            </p>
                        </div>
                        <Button 
                            onClick={onRefresh} 
                            disabled={isLoading}
                            variant="outline" 
                            size="sm"
                            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold gap-2 text-xs uppercase"
                        >
                            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Verificar Nuevamente
                        </Button>
                    </CardContent>
                </Card>

                {/* Seccion de ultimas sesiones activas */}
                <Card className="border-2 border-primary/20 shadow-2xl overflow-visible">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
                        <CardTitle className="flex items-center gap-2.5 text-lg font-black italic tracking-tight text-foreground uppercase">
                            <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                            Ultimas secciones activas
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={onPrint} 
                                disabled={isLoading || sessions.length === 0}
                                variant="outline" 
                                size="sm"
                                className="border-primary/20 hover:bg-primary/10 gap-2 font-bold text-xs"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Descargar PDF
                            </Button>
                            <Button 
                                onClick={onRefresh} 
                                disabled={isLoading}
                                variant="outline" 
                                size="sm"
                                className="border-primary/20 hover:bg-primary/10 gap-2 font-bold text-xs"
                            >
                                <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border text-muted-foreground">
                                        <th className="px-4 py-3 text-left text-sm font-semibold w-64">Sesión</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Cajero</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Cuentas</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">Alimentos</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">Bebidas</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">Propina</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">Efectivo</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">Tarjeta</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session) => (
                                        <React.Fragment key={session.id}>
                                            <tr 
                                                onClick={() => toggleSession(session.id)}
                                                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-4 py-4 text-sm flex items-center font-bold text-slate-200">
                                                    {expandedSessions[session.id] ? (
                                                        <ChevronDown className="h-4 w-4 mr-2 text-primary" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    )}
                                                    {session.name}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-300 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-primary/70" />
                                                        {session.cashier}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm font-medium">{session.total_cuentas}</td>
                                                <td className="px-4 py-4 text-right text-sm text-slate-400">{formatCurrency(session.alimentos)}</td>
                                                <td className="px-4 py-4 text-right text-sm text-slate-400">{formatCurrency(session.bebidas)}</td>
                                                <td className="px-4 py-4 text-right text-sm text-emerald-400 font-medium">{formatCurrency(session.propina)}</td>
                                                <td className="px-4 py-4 text-right text-sm text-blue-400">{formatCurrency(session.restaurante_efectivo)}</td>
                                                <td className="px-4 py-4 text-right text-sm text-purple-400">{formatCurrency(session.tarjeta)}</td>
                                                <td className="px-4 py-4 text-right text-sm font-black text-primary">{formatCurrency(session.total_pagado)}</td>
                                            </tr>

                                            {/* Subtabla de Cuentas */}
                                            {expandedSessions[session.id] && (
                                                <tr className="bg-slate-900/40">
                                                    <td colSpan={9} className="p-0 border-b border-border/50">
                                                        <div className="py-4 px-12">
                                                            <h4 className="text-xs font-black uppercase text-primary/80 mb-3 flex items-center gap-1.5 tracking-wider">
                                                                <Clock className="h-3.5 w-3.5" /> Detalle de Cuentas
                                                            </h4>
                                                            {!session.cuentas || session.cuentas.length === 0 ? (
                                                                <div className="py-6 text-center text-slate-500 font-medium italic animate-pulse">
                                                                    No se encontraron transacciones activas en esta sesión.
                                                                </div>
                                                            ) : (
                                                                <div className="rounded-lg border border-slate-700/30 overflow-hidden shadow-inner">
                                                                    <table className="w-full text-xs">
                                                                        <thead>
                                                                            <tr className="bg-slate-800/80 text-slate-400">
                                                                                <th className="py-2.5 px-4 text-left font-bold">CUENTA (REF / NOMBRE)</th>
                                                                                <th className="py-2.5 px-4 text-right font-bold">PROPINA</th>
                                                                                <th className="py-2.5 px-4 text-right font-bold">IMPORTE TOTAL</th>
                                                                                <th className="py-2.5 px-4 text-center font-bold">ESTADO</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {session.cuentas.map((cuenta) => (
                                                                                <tr key={cuenta.id} className="border-b border-slate-700/20 last:border-0 hover:bg-slate-800/60 transition-colors">
                                                                                    <td className="py-2.5 px-4 text-slate-300 font-semibold">{cuenta.nombre}</td>
                                                                                    <td className="py-2.5 px-4 text-right text-emerald-500/80 font-medium">{formatCurrency(cuenta.propina)}</td>
                                                                                    <td className="py-2.5 px-4 text-right text-slate-100 font-black">{formatCurrency(cuenta.total)}</td>
                                                                                    <td className="py-2.5 px-4 text-center">
                                                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                                                                            cuenta.estado === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                                                            cuenta.estado === 'invoiced' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                                                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                                                        }`}>
                                                                                            {cuenta.estado}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Card className="border-2 border-primary/20 shadow-2xl overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-black italic tracking-tight text-foreground">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    SESIONES ABIERTAS EN TIEMPO REAL (EN VIVO)
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={onPrint} 
                        disabled={isLoading || sessions.length === 0}
                        variant="outline" 
                        size="sm"
                        className="border-primary/20 hover:bg-primary/10 gap-2 font-bold text-xs"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Descargar PDF
                    </Button>
                    <Button 
                        onClick={onRefresh} 
                        disabled={isLoading}
                        variant="outline" 
                        size="sm"
                        className="border-primary/20 hover:bg-primary/10 gap-2 font-bold text-xs"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border text-muted-foreground">
                                <th className="px-4 py-3 text-left text-sm font-semibold w-64">Sesión</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Cajero</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">Cuentas</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Alimentos</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Bebidas</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Propina</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Efectivo</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Tarjeta</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session) => (
                                <React.Fragment key={session.id}>
                                    <tr 
                                        onClick={() => toggleSession(session.id)}
                                        className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-4 text-sm flex items-center font-bold text-slate-200">
                                            {expandedSessions[session.id] ? (
                                                <ChevronDown className="h-4 w-4 mr-2 text-primary" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                                            )}
                                            {session.name}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-300 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-primary/70" />
                                                {session.cashier}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center text-sm font-medium">{session.total_cuentas}</td>
                                        <td className="px-4 py-4 text-right text-sm text-slate-400">{formatCurrency(session.alimentos)}</td>
                                        <td className="px-4 py-4 text-right text-sm text-slate-400">{formatCurrency(session.bebidas)}</td>
                                        <td className="px-4 py-4 text-right text-sm text-emerald-400 font-medium">{formatCurrency(session.propina)}</td>
                                        <td className="px-4 py-4 text-right text-sm text-blue-400">{formatCurrency(session.restaurante_efectivo)}</td>
                                        <td className="px-4 py-4 text-right text-sm text-purple-400">{formatCurrency(session.tarjeta)}</td>
                                        <td className="px-4 py-4 text-right text-sm font-black text-primary">{formatCurrency(session.total_pagado)}</td>
                                    </tr>

                                    {/* Subtabla de Cuentas */}
                                    {expandedSessions[session.id] && (
                                        <tr className="bg-slate-900/40">
                                            <td colSpan={9} className="p-0 border-b border-border/50">
                                                <div className="py-4 px-12">
                                                    <h4 className="text-xs font-black uppercase text-primary/80 mb-3 flex items-center gap-1.5 tracking-wider">
                                                        <Clock className="h-3.5 w-3.5" /> Detalle de Cuentas Activas
                                                    </h4>
                                                    {!session.cuentas || session.cuentas.length === 0 ? (
                                                        <div className="py-6 text-center text-slate-500 font-medium italic animate-pulse">
                                                            No se encontraron transacciones activas en esta sesión.
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-lg border border-slate-700/30 overflow-hidden shadow-inner">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="bg-slate-800/80 text-slate-400">
                                                                        <th className="py-2.5 px-4 text-left font-bold">CUENTA (REF / NOMBRE)</th>
                                                                        <th className="py-2.5 px-4 text-right font-bold">PROPINA</th>
                                                                        <th className="py-2.5 px-4 text-right font-bold">IMPORTE TOTAL</th>
                                                                        <th className="py-2.5 px-4 text-center font-bold">ESTADO</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {session.cuentas.map((cuenta) => (
                                                                        <tr key={cuenta.id} className="border-b border-slate-700/20 last:border-0 hover:bg-slate-800/60 transition-colors">
                                                                            <td className="py-2.5 px-4 text-slate-300 font-semibold">{cuenta.nombre}</td>
                                                                            <td className="py-2.5 px-4 text-right text-emerald-500/80 font-medium">{formatCurrency(cuenta.propina)}</td>
                                                                            <td className="py-2.5 px-4 text-right text-slate-100 font-black">{formatCurrency(cuenta.total)}</td>
                                                                            <td className="py-2.5 px-4 text-center">
                                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                                                                    cuenta.estado === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                                                    cuenta.estado === 'invoiced' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                                                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                                                }`}>
                                                                                    {cuenta.estado}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
