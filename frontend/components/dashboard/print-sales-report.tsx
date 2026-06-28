import React from 'react'
import type { ReportData } from '@/lib/types'

interface PrintSalesReportProps {
    reportData: ReportData | null
    scope: 'period' | 'session'
    sessionId: number | null
    dateFrom: string
    dateTo: string
}

export function PrintSalesReport({ reportData, scope, sessionId, dateFrom, dateTo }: PrintSalesReportProps) {
    if (!reportData) return null

    // 1. Determine Title and Scope Data
    let titleRange = ''
    let accounts: { cliente: string; total: number }[] = []
    let filteredProducts: any[] = []
    let cashTotal = 0
    let cardTotal = 0
    let tipTotal = 0

    if (scope === 'session' && sessionId !== null) {
        let targetSession: any = null
        if (reportData.data) {
            for (const day of reportData.data) {
                const found = day.sesiones?.find((s: any) => s.id === sessionId)
                if (found) {
                    targetSession = found
                    break
                }
            }
        }

        if (targetSession) {
            titleRange = `${targetSession.name}`
            accounts = (targetSession.cuentas || []).map((c: any) => ({
                cliente: c.cliente || 'Cliente General',
                total: c.total || 0
            }))

            const sessionOrderIds = new Set(targetSession.cuentas?.map((c: any) => c.id) || [])
            filteredProducts = (reportData.productos || []).filter((p: any) => sessionOrderIds.has(p.order_id))

            cashTotal = targetSession.restaurante_efectivo || 0
            cardTotal = targetSession.tarjeta || 0
            tipTotal = targetSession.propina || 0
        } else {
            titleRange = 'SESION NO ENCONTRADA'
        }
    } else {
        titleRange = `Periodo del ${dateFrom} al ${dateTo}`
        
        // Aggregate all accounts
        const allAccounts: { cliente: string; total: number }[] = []
        if (reportData.data) {
            reportData.data.forEach((day: any) => {
                if (day.sesiones) {
                    day.sesiones.forEach((s: any) => {
                        if (s.cuentas) {
                            s.cuentas.forEach((c: any) => {
                                allAccounts.push({
                                    cliente: c.cliente || 'Cliente General',
                                    total: c.total || 0
                                })
                            })
                        }
                    })
                }
            })
        }
        accounts = allAccounts
        filteredProducts = reportData.productos || []

        cashTotal = reportData.data.reduce((acc, row) => acc + (row.restaurante_efectivo || 0), 0)
        cardTotal = reportData.data.reduce((acc, row) => acc + (row.tarjeta || 0), 0)
        tipTotal = reportData.data.reduce((acc, row) => acc + (row.propina || 0), 0)
    }

    // 2. Group Accounts by Customer
    const customerMap: Record<string, number> = {}
    accounts.forEach(c => {
        customerMap[c.cliente] = (customerMap[c.cliente] || 0) + c.total
    })
    const customerDetails = Object.entries(customerMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)

    const totalCustomersAmount = customerDetails.reduce((acc, c) => acc + c.amount, 0)

    // 3. Group and Consolidate Products by Category and Name
    const categoryGroups: Record<string, { product: string; qty: number; price: number; total: number }[]> = {}
    filteredProducts.forEach((p: any) => {
        const cat = p.categoria || 'Otros'
        if (!categoryGroups[cat]) {
            categoryGroups[cat] = []
        }
        const existing = categoryGroups[cat].find(item => item.product === p.producto)
        if (existing) {
            existing.qty += p.cantidad
            existing.total += p.total
            existing.price = existing.qty > 0 ? existing.total / existing.qty : p.precio
        } else {
            categoryGroups[cat].push({
                product: p.producto,
                qty: p.cantidad,
                price: p.precio,
                total: p.total
            })
        }
    })

    // Sort category items by total sales descending
    Object.keys(categoryGroups).forEach(cat => {
        categoryGroups[cat].sort((a, b) => b.total - a.total)
    })

    // 4. Calculate Category Summaries
    const categorySummaries = Object.entries(categoryGroups).map(([category, items]) => {
        const qtySum = items.reduce((acc, item) => acc + item.qty, 0)
        const totalSum = items.reduce((acc, item) => acc + item.total, 0)
        return { category, qty: qtySum, total: totalSum }
    }).sort((a, b) => b.total - a.total)

    const grandTotalCategories = categorySummaries.reduce((acc, c) => acc + c.total, 0)

    const formatCurrency = (val: number) => {
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <div className="w-full text-black bg-white p-4 font-sans text-[9px] leading-relaxed">
            {/* Header */}
            <div className="text-center border-b border-black pb-2 mb-4">
                <h1 className="text-sm font-black uppercase tracking-wider">Reporte de Ventas por Producto</h1>
                <p className="text-[10px] font-bold text-gray-700">{titleRange}</p>
                <p className="text-[7.5px] text-gray-500">
                    Generado el {new Date().toLocaleString('es-ES', { timeZone: 'America/El_Salvador' })} | BI Analytics Herradura
                </p>
            </div>

            {/* 1. Detalle por Cliente */}
            <div className="mb-5">
                <h2 className="text-[10px] font-black uppercase border-b border-black pb-0.5 mb-1.5 text-gray-800">
                    1. Detalle por Cliente
                </h2>
                {customerDetails.length === 0 ? (
                    <p className="italic text-gray-500">No hay ventas a clientes registradas.</p>
                ) : (
                    <div className="max-w-md">
                        <table className="w-full text-left border-collapse text-[8.5px]">
                            <thead>
                                <tr className="border-b border-gray-400 font-bold">
                                    <th className="py-0.5">Nombre de Cliente</th>
                                    <th className="py-0.5 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerDetails.map((c, idx) => (
                                    <tr key={`cust-${idx}`} className="border-b border-gray-100">
                                        <td className="py-0.5 text-gray-800 font-medium">{c.name}</td>
                                        <td className="py-0.5 text-right font-semibold">{formatCurrency(c.amount)}</td>
                                    </tr>
                                ))}
                                <tr className="border-t border-black font-bold">
                                    <td className="py-1">Monto Total Clientes:</td>
                                    <td className="py-1 text-right text-[9px]">{formatCurrency(totalCustomersAmount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 2. Secciones de Venta por Producto */}
            <div className="mb-5 space-y-4">
                <h2 className="text-[10px] font-black uppercase border-b border-black pb-0.5 text-gray-800">
                    2. Ventas por Categoría de Producto
                </h2>
                {Object.keys(categoryGroups).length === 0 ? (
                    <p className="italic text-gray-500">No hay líneas de producto registradas.</p>
                ) : (
                    Object.entries(categoryGroups).map(([cat, items], catIdx) => {
                        const catTotal = items.reduce((acc, i) => acc + i.total, 0)
                        return (
                            <div key={`cat-sect-${catIdx}`} className="keep-together">
                                <h3 className="text-[9px] font-black text-gray-700 bg-gray-100 px-1 py-0.5 mb-1">
                                    Sección: {cat}
                                </h3>
                                <table className="w-full text-left border-collapse text-[8px]">
                                    <thead>
                                        <tr className="border-b border-gray-400 font-bold text-gray-600">
                                            <th className="py-0.5 w-1/2">Producto</th>
                                            <th className="py-0.5 text-center">Cant.</th>
                                            <th className="py-0.5 text-right">Precio Unit.</th>
                                            <th className="py-0.5 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={`p-item-${idx}`} className="border-b border-gray-100">
                                                <td className="py-0.5 text-gray-800 font-medium">{item.product}</td>
                                                <td className="py-0.5 text-center font-medium">{item.qty}</td>
                                                <td className="py-0.5 text-right text-gray-500">{formatCurrency(item.price)}</td>
                                                <td className="py-0.5 text-right font-semibold">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="font-bold border-t border-gray-300">
                                            <td colSpan={3} className="py-1 text-right text-gray-600">Total {cat}:</td>
                                            <td className="py-1 text-right">{formatCurrency(catTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )
                    })
                )}

                {/* Total consolidado de todas las categorías */}
                {Object.keys(categoryGroups).length > 0 && (
                    <div className="border-t-2 border-black pt-1.5 flex justify-between items-center font-bold text-[10px]">
                        <span>TOTAL VENTA POR CATEGORÍAS VENDIDAS:</span>
                        <span>{formatCurrency(grandTotalCategories)}</span>
                    </div>
                )}
            </div>

            {/* 3. Resumen Final Integrado */}
            <div className="keep-together border-t border-black pt-3 mt-4">
                <h2 className="text-[10px] font-black uppercase border-b border-black pb-0.5 mb-2 text-gray-800">
                    3. Resumen Final Integrado
                </h2>
                <div className="grid grid-cols-2 gap-8 items-start">
                    {/* Resumen Básico de Métodos de Pago */}
                    <div>
                        <h3 className="text-[8.5px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Flujo de Fondos (Métodos de Pago)</h3>
                        <table className="w-full border-collapse text-[8px]">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-1 font-medium text-gray-600">Venta en Efectivo (Neto):</td>
                                    <td className="py-1 text-right font-bold">{formatCurrency(cashTotal)}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-1 font-medium text-gray-600">Venta en Tarjeta (Neto):</td>
                                    <td className="py-1 text-right font-bold">{formatCurrency(cardTotal)}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-1 font-medium text-gray-600">Propinas Acumuladas:</td>
                                    <td className="py-1 text-right font-bold text-green-700">{formatCurrency(tipTotal)}</td>
                                </tr>
                                <tr className="border-t border-black font-bold text-[8.5px]">
                                    <td className="py-1">Total Ingresos Recibidos:</td>
                                    <td className="py-1 text-right">{formatCurrency(cashTotal + cardTotal + tipTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Resumen de Ventas por Categoría */}
                    <div>
                        <h3 className="text-[8.5px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Ventas por Categoría</h3>
                        <table className="w-full border-collapse text-[8px]">
                            <thead>
                                <tr className="border-b border-gray-400 font-bold text-gray-600">
                                    <th className="py-0.5 text-left">Categoría</th>
                                    <th className="py-0.5 text-center">Cant.</th>
                                    <th className="py-0.5 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categorySummaries.map((c, idx) => (
                                    <tr key={`cat-sum-${idx}`} className="border-b border-gray-100">
                                        <td className="py-0.5 font-medium text-gray-800">{c.category}</td>
                                        <td className="py-0.5 text-center font-medium">{c.qty}</td>
                                        <td className="py-0.5 text-right font-semibold">{formatCurrency(c.total)}</td>
                                    </tr>
                                ))}
                                <tr className="border-t border-black font-bold text-[8.5px]">
                                    <td colSpan={2} className="py-1 text-left">Total de Ventas:</td>
                                    <td className="py-1 text-right">{formatCurrency(grandTotalCategories)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
