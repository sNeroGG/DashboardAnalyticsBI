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

export interface ReportSession {
    id: number
    name: string
    total_cuentas: number
    total_pagado: number
    desglose?: ReportSessionDesglose[]
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

export interface ReportData {
    data: ReportRow[]
    usuarios: any[] // Temporal, podemos tipar mas estricto despues
    metodos: any[]
}

export interface ReportPayload {
    date_from: string
    date_to: string
    users?: number[]
    payment_methods?: number[]
    product_groups?: string[]
    force_refresh?: boolean
}
