export interface Master {
    id: number
    name: string
}

export interface Masters {
    'res.users': Master[]
    'pos.payment.method': Master[]
    [key: string]: Master[]
}

export interface ReportSessionDesglose {
    fecha: string
    monto: number
}

export interface ReportCuenta {
    id: number
    nombre: string
    total: number
    propina: number
    estado: string
}

export interface ReportSession {
    id: number
    name: string
    total_cuentas: number
    total_pagado: number
    propina: number
    desglose?: ReportSessionDesglose[]
    cuentas?: ReportCuenta[]
}

export interface ReportRow {
    fecha: string
    total_cuentas: number
    total_pagado: number
    alimentos: number
    bebidas: number
    propina: number
    otros: number
    restaurante_efectivo: number
    tarjeta: number
    sesiones: ReportSession[]
}

export interface UserData {
    nombre: string
    ventas: number
}

export interface POSPaymentMethodData {
    metodo: string
    monto: number
}

export interface ReportData {
    status: string
    data: ReportRow[]
    usuarios: UserData[]
    metodos: POSPaymentMethodData[]
    advanced_analytics?: any
}

export interface ReportPayload {
    date_from: string
    date_to: string
    users?: number[]
    payments?: number[]
    groups?: string[]
    states?: string[]
    force_refresh?: boolean
}
