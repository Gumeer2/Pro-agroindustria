import React, { useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";

interface TicketData {
    folio: string;
    ticket_number: string;
    date: string;
    time: string;
    reference: string; // e.g., N/A
    operation: string; // e.g., ENTRADA / SALIDA
    scale_number: number;
    product: string;
    presentation: string; // e.g., GRANEL
    client: string; // Cliente o Proveedor
    sale_order: string; // N/A
    withdrawal_letter: string; // Carta Porte
    driver: string;
    tractor_plate: string;
    trailer_plate: string;
    destination: string;
    transporter: string;
    consignee: string; // Consignado
    observations: string;
    programmed_weight: string; // Cantidad Programada e.g. N/A
    economic_number: string;

    // Weights
    entry_weight: number;
    exit_weight: number;
    net_weight: number;
    tare_weight: number;
    gross_weight: number;

    // Dates
    entry_at: string;
    exit_at: string;

    weighmaster: string;
    documenter: string;
    is_vessel: boolean;
}

interface TicketProps {
    ticket: TicketData;
}

const TicketCopy: React.FC<{
    ticket: TicketData;
    copyName: string;
    isLast?: boolean;
}> = ({ ticket, copyName, isLast }) => {
    const isVessel = ticket.is_vessel;
    const { props } = usePage<any>();
    const tenant = props.tenant;

    return (
        <div
            className={`mx-auto bg-white relative text-black font-sans box-border border border-gray-300 print:border-none 
                ${isVessel ? "w-[21cm] p-2 min-h-[13.5cm] max-h-[14cm] overflow-hidden" : "w-[24cm] p-6 pt-2 print:pt-10 mb-4"} 
                ${!isLast ? "print:break-after-page" : ""}`}
        >
            {/* --- Header --- */}
            <div className={`flex items-center ${isVessel ? "mb-1" : "mb-2"}`}>
                {/* Logo Section */}
                <div className={`${isVessel ? "w-[15%]" : "w-[20%]"} p-1 flex items-center justify-center`}>
                    <img
                        src={tenant?.logo || "/images/logovecode.png"}
                        alt={tenant?.name || "Logo"}
                        className={`${isVessel ? "h-12" : "h-20"} w-auto object-contain`}
                        onError={(e) => {
                            e.currentTarget.src = "/img/Proagro2.png";
                        }}
                    />
                </div>

                {/* Company Info */}
                <div className={`${isVessel ? "w-[60%]" : "w-[55%]"} flex flex-col justify-center items-center text-center px-1`}>
                    <h1 className={`font-bold leading-tight tracking-tight ${isVessel ? "text-[16px]" : "text-[24px]"}`}>
                        {tenant?.name || 'PRO-AGROINDUSTRIA S.A. DE C.V.'}
                    </h1>
                    <p className={`${isVessel ? "text-[9px]" : "text-[10px]"} font-bold`}>
                        {tenant?.slug === 'proagro' ? 'COATZACOALCOS, VERACRUZ' : 'SISTEMA DE LOGÍSTICA'}
                    </p>
                    <p className={`font-bold ${isVessel ? "mt-0 text-[10px]" : "mt-1 text-[14px]"}`}>
                        {tenant?.slug === 'proagro' ? 'LOGISTICA Y SUMINISTROS' : 'CONTROL DE PESO'}
                    </p>
                    <div className={`${isVessel ? "px-2 py-0 mt-1 text-[10px]" : "border border-black px-4 py-0.5 mt-2 text-[12px] bg-gray-50"} font-bold uppercase tracking-widest`}>
                        TICKET DE PESO
                    </div>
                </div>

                {/* Folio & Date */}
                <div className={`${isVessel ? "w-[25%]" : "w-[25%]"} flex flex-col border border-black`}>
                    {/* Folio */}
                    <div className={`flex-1 flex flex-col items-center justify-center ${isVessel ? "p-1" : "p-1"} border-b border-black`}>
                        <div className={`${isVessel ? "text-[9px]" : "text-[10px]"} font-bold uppercase`}>
                            FOLIO
                        </div>
                        <div className={`border-[2px] border-black ${isVessel ? "px-2 h-6" : "px-3 py-0.5 h-10"} mt-0.5 flex items-center justify-center font-bold bg-white`}>
                            <span className={`${isVessel ? "text-[18px]" : "text-[24px]"} text-red-600`}>
                                {(ticket.folio || "").split("-").pop()}
                            </span>
                        </div>
                    </div>
                    {/* Date Row */}
                    <div className={`flex border-t border-black ${isVessel ? "text-[8px] h-8" : "text-[10px]"}`}>
                        <div className={`w-1/3 flex items-center justify-center font-bold bg-gray-700 text-white uppercase h-full border-r border-black ${isVessel ? "text-[7px]" : ""}`}>
                            Fecha:
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center font-mono">
                            <div className={`flex w-full border-b border-black font-bold ${isVessel ? "text-[6px] bg-gray-50" : "text-[8px]"}`}>
                                <span className="w-1/3 flex justify-center border-r border-black">DIA</span>
                                <span className="w-1/3 flex justify-center border-r border-black">MES</span>
                                <span className="w-1/3 flex justify-center">AÑO</span>
                            </div>
                            <div className={`flex w-full font-bold h-full ${isVessel ? "text-[11px] leading-tight" : "text-[12px]"}`}>
                                <span className="w-1/3 flex justify-center border-r border-black items-center">{ticket.date.split("/")[0]}</span>
                                <span className="w-1/3 flex justify-center border-r border-black items-center">{ticket.date.split("/")[1]}</span>
                                <span className="w-1/3 flex justify-center items-center">{ticket.date.split("/")[2]}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className={`flex border border-black ${isVessel ? "text-[10px]" : "text-[12px]"}`}>
                {/* --- Data Column --- */}
                <div className={`${isVessel ? "w-[65%]" : "w-[60%]"} border-r border-black flex flex-col`}>
                    <div className="flex border-b border-black">
                        <div className="w-1/4 font-bold border-r border-black px-1.5 py-0.5 uppercase">
                            Ref:
                        </div>
                        <div className="w-1/4 px-1.5 py-0.5 border-r border-black truncate">
                            {ticket.reference || "N/A"}
                        </div>
                        <div className="w-1/4 font-bold border-r border-black px-1.5 py-0.5 uppercase">
                            Op:
                        </div>
                        <div className="w-1/4 px-1.5 py-0.5 text-center font-bold">
                            {ticket.operation}
                        </div>
                    </div>

                    {[
                        ["Producto:", `${ticket.product} (${ticket.presentation})`],
                        ["Cant Prog:", ticket.programmed_weight || "N/A"],
                        ["Cliente/Prov:", ticket.client],
                        ["Orden Venta:", ticket.sale_order || "N/A"],
                        ["Carta Porte:", ticket.withdrawal_letter],
                    ].map(([label, value], idx) => (
                        <div key={idx} className="flex border-b border-black min-h-[16px]">
                            <div className="w-[30%] font-bold border-r border-black px-1.5 py-0.5 uppercase text-[9.5px]">
                                {label}
                            </div>
                            <div className="w-[70%] px-1.5 py-0.5 break-words uppercase text-[10px] leading-tight font-medium">{value}</div>
                        </div>
                    ))}

                    <div className="flex border-b border-black">
                        <div className="w-[18%] font-bold border-r border-black px-1.5 py-0.5 uppercase leading-tight text-[10px] flex items-center">
                            Placas:
                        </div>
                        <div className="w-[32%] px-1.5 py-0.5 border-r border-black font-mono font-bold text-sm tracking-wider text-black flex items-center">
                            {ticket.tractor_plate}
                        </div>
                        {ticket.trailer_plate && ticket.trailer_plate !== "N/A" ? (
                            <>
                                <div className="w-[18%] font-bold border-r border-black px-1.5 py-0.5 uppercase leading-tight text-[10px] flex items-center">
                                    Remolque:
                                </div>
                                <div className="w-[32%] px-1.5 py-0.5 font-mono font-bold text-sm tracking-wider text-black flex items-center">
                                    {ticket.trailer_plate}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-[18%] font-bold border-r border-black px-1.5 py-0.5 uppercase leading-tight text-[10px] flex items-center">
                                    Econo:
                                </div>
                                <div className="w-[32%] px-1.5 py-0.5 font-mono font-bold text-sm tracking-wider text-black flex items-center">
                                    {ticket.economic_number}
                                </div>
                            </>
                        )}
                    </div>

                    {[
                        ["Conductor:", ticket.driver],
                        ["Destino:", ticket.destination],
                        ["Transp:", ticket.transporter],
                        ["Consig:", ticket.consignee],
                    ].map(([label, value], idx) => (
                        <div key={idx} className="flex border-b border-black min-h-[16px]">
                            <div className="w-1/4 font-bold border-r border-black px-1.5 py-0.5 uppercase text-[9.5px]">
                                {label}
                            </div>
                            <div className="w-3/4 px-1.5 py-0.5 uppercase break-words text-[10px] leading-tight">
                                {value}
                            </div>
                        </div>
                    ))}

                    <div className={`flex flex-col ${isVessel ? "min-h-[30px]" : "min-h-[60px] flex-1"}`}>
                        <div className="font-bold px-1.5 pt-0.5 text-[8px] uppercase">
                            Observaciones:
                        </div>
                        <div className="px-1.5 py-0.5 text-[9px] italic leading-tight break-words">
                            {ticket.observations || "N/A"}
                        </div>
                    </div>
                </div>

                {/* --- Weight Section --- */}
                <div className={`${isVessel ? "w-[35%]" : "w-[40%]"} flex flex-col font-mono bg-gray-50/5`}>
                    <div className={`text-center font-bold uppercase text-[9px] ${isVessel ? "border-b border-black py-0.5" : "border-b border-black py-1 h-[19px]"}`}>
                        BASCULA {ticket.scale_number}
                    </div>

                    <div className={`${isVessel ? "flex-1 p-1.5 space-y-1" : "flex-1 p-3 space-y-2 flex flex-col justify-center text-[13px]"}`}>
                        <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5 text-[10px]">
                            <span>ENTRADA:</span>
                            <div className="flex flex-col items-end">
                                <span>
                                    {(ticket.entry_weight).toLocaleString("es-MX")} kg
                                </span>
                                <span className="text-[8px] opacity-70">
                                    {ticket.entry_at || ticket.date}
                                </span>
                            </div>
                        </div>

                        {ticket.net_weight > 0 ? (
                            <div className="space-y-1 mt-1">
                                <div className="flex justify-between text-[10px]">
                                    <span>BRUTO:</span>
                                    <span>{(ticket.gross_weight).toLocaleString("es-MX")} kg</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span>TARA:</span>
                                    <span>{(ticket.tare_weight).toLocaleString("es-MX")} kg</span>
                                </div>
                                <div className={`flex justify-between pt-0.5 border-t border-black font-bold ${isVessel ? "text-[14px]" : "text-[18px]"}`}>
                                    <span>NETO:</span>
                                    <span>{(ticket.net_weight).toLocaleString("es-MX")} kg</span>
                                </div>
                                <div className="text-right text-[8px] opacity-70">
                                    {ticket.exit_at || ticket.time}
                                </div>
                            </div>
                        ) : (
                            <div className={`flex-1 flex items-center justify-center opacity-20 rotate-[-15deg] font-bold border-2 border-dashed border-gray-300 ${isVessel ? "m-1 text-[14px]" : "m-4 text-[20px]"}`}>
                                PENDIENTE
                            </div>
                        )}
                        
                        {isVessel && (
                            <div className="mt-auto text-[7px] text-center opacity-40 uppercase pt-2">
                                Pesado en: {tenant?.name || 'VECODE'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Footer / Signatures --- */}
            <div className={`flex justify-between px-1 items-end ${isVessel ? "mt-2 h-12" : "mt-auto h-24 mb-2"}`}>
                {[
                    ["Documentador", ticket.documenter],
                    ["Pesador", ticket.weighmaster],
                    ["Operador", ticket.driver],
                ].map(([role, name], idx) => (
                    <div key={idx} className="flex flex-col items-center w-[30%]">
                        <div className={`${isVessel ? "text-[8px]" : "text-[9px]"} w-full border-b border-black text-center flex items-end justify-center pb-0.5 truncate uppercase`}>
                            {name}
                        </div>
                        <div className={`${isVessel ? "text-[7px]" : "text-[8px]"} font-bold text-center mt-0.5 uppercase`}>
                            {role}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default function Ticket({ ticket }: TicketProps) {
    useEffect(() => {
        // Optional: auto print
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("from") === "history") {
            try {
                window.close();
            } catch (e) {
                // Ignore
            }
            // Fallback in case window.close() is blocked (e.g., opened in same tab)
            window.location.href = route("scale.tickets.index");
            return;
        }

        if (
            ticket.net_weight > 0 ||
            (ticket.operation &&
                ticket.operation.toUpperCase().includes("SALIDA"))
        ) {
            window.location.href = route("scale.index") + "?view=pending";
        } else {
            window.history.back();
        }
    };

    return (
        <div className="bg-gray-200 min-h-screen p-4 print:p-0 print:bg-white text-sm">
            <Head title={`Ticket - ${ticket.ticket_number}`} />

            <style>{`
                @media print {
                    @page {
                        size: ${ticket.is_vessel ? "half-letter landscape" : "letter landscape"};
                        margin: ${ticket.is_vessel ? "0.1cm" : "2.5cm 0.5cm 0.5cm 0.5cm"};
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto mb-4 flex justify-between print:hidden">
                <button
                    onClick={handleBack}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"
                >
                    Regresar
                </button>
                <div className="text-xl font-bold text-gray-800">
                    Vista Previa de Ticket
                </div>
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow flex items-center gap-2 font-bold"
                >
                    IMPRIMIR
                </button>
            </div>

            <div className="max-w-[25cm] mx-auto print:max-w-none">
                <TicketCopy ticket={ticket} copyName="ORIGINAL" />
                {/* <TicketCopy ticket={ticket} copyName="COPIA" isLast={true} /> */}
            </div>
        </div>
    );
}
