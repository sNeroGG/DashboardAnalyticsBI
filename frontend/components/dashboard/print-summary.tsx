import type { ReportData } from '@/lib/types'

interface PrintSummaryProps {
    reportData: ReportData
    dateFrom: string
    dateTo: string
}

export function PrintSummary({ reportData, dateFrom, dateTo }: PrintSummaryProps) {
    const data = reportData.data || []
    
    // 1. General Metrics
    const totalVentas = data.reduce((acc, row) => acc + (row.total_pagado || 0), 0)
    const totalCuentas = data.reduce((acc, row) => acc + (row.total_cuentas || 0), 0)
    const ticketPromedio = totalCuentas > 0 ? totalVentas / totalCuentas : 0
    
    const totalAlimentos = data.reduce((acc, row) => acc + (row.alimentos || 0), 0)
    const totalBebidas = data.reduce((acc, row) => acc + (row.bebidas || 0), 0)
    const totalPropina = data.reduce((acc, row) => acc + (row.propina || 0), 0)
    const totalOtros = data.reduce((acc, row) => acc + (row.otros || 0), 0)

    const totalEfectivo = data.reduce((acc, row) => acc + (row.restaurante_efectivo || 0), 0)
    const totalTarjeta = data.reduce((acc, row) => acc + (row.tarjeta || 0), 0)
    
    // 2. Advanced Analytics
    const advanced = reportData.advanced_analytics
    const proyeccion = advanced?.proyeccion_mes || {}
    const analisisSemanal = advanced?.analisis_semanal || []
    
    // 3. User sales
    const usuarios = reportData.usuarios || []
    
    // 4. Payment methods
    const metodos = reportData.metodos || []

    // 5. Aggregate all Odoo sessions across all rows
    const todasLasSesiones = data.reduce((acc: any[], row) => {
        if (row.sesiones) {
            row.sesiones.forEach((s) => {
                acc.push({
                    fecha: row.fecha,
                    nombre: s.name,
                    cuentas: s.total_cuentas || 0,
                    monto: s.total_pagado || 0,
                    propina: s.propina || 0
                })
            })
        }
        return acc
    }, [])

    return (
        <div className="w-full">
            {/* Header */}
            <div className="text-center border-b border-black pb-1 mb-3">
                <h1 className="text-sm font-bold uppercase tracking-wider text-black">Resumen General de Operaciones</h1>
                <p className="text-[10px] font-medium text-gray-700">
                    Periodo Evaluado: <span className="font-bold">{dateFrom}</span> al <span className="font-bold">{dateTo}</span>
                </p>
                <p className="text-[8px] text-gray-500">
                    Generado el {new Date().toLocaleString('es-ES', { timeZone: 'America/El_Salvador' })} | BI Analytics Herradura
                </p>
            </div>

            {/* Two Column Content */}
            <div className="grid grid-cols-2 gap-5 items-start">
                {/* COLUMN 1 */}
                <div className="space-y-3.5">
                    {/* Section 1: Resumen General */}
                    <div>
                        <h2 className="text-[9px] font-black uppercase border-b border-black pb-0.5 mb-1 text-gray-800">
                            1. Métricas Generales de Ventas
                        </h2>
                        <table className="w-full text-left border-collapse text-[8.5px] text-black">
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Venta Total Acumulada:</th>
                                    <td className="py-0.5 text-right font-bold">
                                        ${totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Total de Tickets:</th>
                                    <td className="py-0.5 text-right font-semibold">
                                        {totalCuentas}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Ticket Promedio por Mesa:</th>
                                    <td className="py-0.5 text-right font-semibold">
                                        ${ticketPromedio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Venta Alimentos:</th>
                                    <td className="py-0.5 text-right">
                                        ${totalAlimentos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Venta Bebidas:</th>
                                    <td className="py-0.5 text-right">
                                        ${totalBebidas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Venta Efectivo (POS):</th>
                                    <td className="py-0.5 text-right">
                                        ${totalEfectivo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Venta Tarjetas (POS):</th>
                                    <td className="py-0.5 text-right">
                                        ${totalTarjeta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Total Propinas:</th>
                                    <td className="py-0.5 text-right font-medium text-green-700">
                                        ${totalPropina.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Otros/Varios:</th>
                                    <td className="py-0.5 text-right">
                                        ${totalOtros.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 2: Métodos de Pago */}
                    <div>
                        <h2 className="text-[9px] font-black uppercase border-b border-black pb-0.5 mb-1 text-gray-800">
                            2. Desglose Métodos de Pago
                        </h2>
                        <table className="w-full text-left border-collapse text-[8px] text-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-0.5 font-bold">Método</th>
                                    <th className="py-0.5 text-right font-bold">Monto</th>
                                    <th className="py-0.5 text-right font-bold">Part.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metodos.map((m: any, idx: number) => {
                                    const part = totalVentas > 0 ? (m.monto / totalVentas) * 100 : 0
                                    return (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-0.5 font-medium">{m.metodo}</td>
                                            <td className="py-0.5 text-right">
                                                ${m.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-0.5 text-right text-gray-600">
                                                {part.toFixed(1)}%
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Section 3: Ventas por Usuario */}
                    <div>
                        <h2 className="text-[9px] font-black uppercase border-b border-black pb-0.5 mb-1 text-gray-800">
                            3. Ventas por Vendedor/Usuario
                        </h2>
                        <table className="w-full text-left border-collapse text-[8px] text-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-0.5 font-bold">Vendedor</th>
                                    <th className="py-0.5 text-right font-bold">Ventas</th>
                                    <th className="py-0.5 text-right font-bold">Part.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.slice(0, 10).map((u: any, idx: number) => {
                                    const part = totalVentas > 0 ? (u.ventas / totalVentas) * 100 : 0
                                    return (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-0.5 font-medium">{u.nombre}</td>
                                            <td className="py-0.5 text-right font-semibold">
                                                ${u.ventas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-0.5 text-right text-gray-600">
                                                {part.toFixed(1)}%
                                            </td>
                                        </tr>
                                    )
                                })}
                                {usuarios.length > 10 && (
                                    <tr>
                                        <td colSpan={3} className="py-0.5 text-center text-[7px] text-gray-500 italic">
                                            Mostrando {Math.min(10, usuarios.length)} de {usuarios.length} vendedores
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* COLUMN 2 */}
                <div className="space-y-3.5">
                    {/* Section 4: Proyecciones */}
                    <div>
                        <h2 className="text-[9px] font-black uppercase border-b border-black pb-0.5 mb-1 text-gray-800">
                            4. Proyecciones Matemáticas de Cierre
                        </h2>
                        <table className="w-full text-left border-collapse text-[8.5px] text-black">
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Venta Acumulada en Periodo:</th>
                                    <td className="py-0.5 text-right font-bold">
                                        ${(proyeccion.venta_acumulada || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Días Transcurridos:</th>
                                    <td className="py-0.5 text-right">
                                        {proyeccion.dias_transcurridos || 0} días
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Venta Promedio Diario:</th>
                                    <td className="py-0.5 text-right font-semibold">
                                        ${(proyeccion.promedio_diario || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Días Totales del Mes Base:</th>
                                    <td className="py-0.5 text-right">
                                        {proyeccion.dias_totales_mes || 0} días
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <th className="py-0.5 font-medium">Proyección Venta Fin de Mes:</th>
                                    <td className="py-0.5 text-right font-bold text-green-700">
                                        ${(proyeccion.venta_proyectada || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 5: Rendimiento Semanal */}
                    <div>
                        <h2 className="text-[9px] font-black uppercase border-b border-black pb-0.5 mb-1 text-gray-800">
                            5. Desglose y Rendimiento por Día de la Semana
                        </h2>
                        <table className="w-full text-left border-collapse text-[8px] text-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-0.5 font-bold">Día</th>
                                    <th className="py-0.5 text-right font-bold">P. Ctas</th>
                                    <th className="py-0.5 text-right font-bold">P. Monto</th>
                                    <th className="py-0.5 text-right font-bold">Total</th>
                                    <th className="py-0.5 text-center font-bold">Cant.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analisisSemanal.map((dia: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="py-0.5 font-bold">{dia.dia}</td>
                                        <td className="py-0.5 text-right">
                                            {dia.promedio_tickets.toFixed(1)}
                                        </td>
                                        <td className="py-0.5 text-right">
                                            ${dia.promedio_monto.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-0.5 text-right font-semibold">
                                            ${(dia.monto_total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="py-0.5 text-center text-gray-600">
                                            {dia.dias_contados}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Section 6: Registro Diario de Ventas */}
                    <div>
                        <h2 className="text-[9px] font-black uppercase border-b border-black pb-0.5 mb-1 text-gray-800">
                            6. Registro Diario de Ventas (Muestra)
                        </h2>
                        <table className="w-full text-left border-collapse text-[8px] text-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-0.5 font-bold">Fecha</th>
                                    <th className="py-0.5 text-right font-bold">Ctas</th>
                                    <th className="py-0.5 text-right font-bold">Alimentos</th>
                                    <th className="py-0.5 text-right font-bold">Bebidas</th>
                                    <th className="py-0.5 text-right font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 8).map((row: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="py-0.5 font-medium">{row.fecha}</td>
                                        <td className="py-0.5 text-right">{row.total_cuentas}</td>
                                        <td className="py-0.5 text-right">${(row.alimentos || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        <td className="py-0.5 text-right">${(row.bebidas || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        <td className="py-0.5 text-right font-semibold">${row.total_pagado.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    </tr>
                                ))}
                                {data.length > 8 && (
                                    <tr>
                                        <td colSpan={5} className="py-0.5 text-center text-[7px] text-gray-500 italic">
                                            Mostrando los primeros 8 de {data.length} días de venta
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Section 7: Registro de Sesiones de Caja */}
                    <div>
                        <h2 className="text-[9px] font-black uppercase border-b border-black pb-0.5 mb-1 text-gray-800">
                            7. Últimas Sesiones de Caja Odoo (Muestra)
                        </h2>
                        <table className="w-full text-left border-collapse text-[8px] text-black">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-0.5 font-bold">Fecha</th>
                                    <th className="py-0.5 font-bold">Sesión</th>
                                    <th className="py-0.5 text-right font-bold">Ctas</th>
                                    <th className="py-0.5 text-right font-bold">Venta</th>
                                    <th className="py-0.5 text-right font-bold">Propina</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todasLasSesiones.slice(0, 8).map((s: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="py-0.5 font-medium">{s.fecha}</td>
                                        <td className="py-0.5 text-gray-700 truncate max-w-[80px]">{s.nombre}</td>
                                        <td className="py-0.5 text-right">{s.cuentas}</td>
                                        <td className="py-0.5 text-right font-semibold">${s.monto.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        <td className="py-0.5 text-right text-green-700">${s.propina.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    </tr>
                                ))}
                                {todasLasSesiones.length > 8 && (
                                    <tr>
                                        <td colSpan={5} className="py-0.5 text-center text-[7px] text-gray-500 italic">
                                            Mostrando las primeras 8 de {todasLasSesiones.length} sesiones
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
