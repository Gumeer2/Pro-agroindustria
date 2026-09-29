export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
export interface Client {
    id: number;
    business_name: string;
    rfc?: string;
    address?: string;
}

export interface Product {
    id: number;
    name: string;
    code: string;
}

export interface SalesOrder {
    id: number;
    folio: string;
    client?: Client;
    product?: Product;
    balance?: string;
    sale_order?: string;
}

export interface Transporter {
    id: number;
    name: string;
}

export interface ShipmentOrder {
    id: number;
    folio: string;
    date: string;
    status: string;
    client_id: string;
    sales_order_id: string;
    product_id: string;

    // Snapshot / Data fields
    client_name?: string;
    product_name?: string;
    operator_name?: string;
    transport_company?: string;
    unit_type?: string;
    tractor_plate?: string;
    trailer_plate?: string;
    economic_number?: string;
    license_number?: string;
    unit_number?: string;
    origin_id?: number | string;
    origin?: string | { id: number; name: string };
    destination?: string;
    state?: string;
    observations?: string;
    documenter_name?: string;
    scale_name?: string;
    sacks_count?: string;
    sacks_count_raw?: string;

    // Cargo details
    presentation: string;
    sack_type?: string;
    programmed_tons: string;
    shortage_balance?: string;

    // Relations
    client?: Client;
    sales_order?: SalesOrder;
    product?: Product;
    transporter?: Transporter;
    driver?: any;
    vessel?: any;
    vehicle?: any;
}
