import React from "react";
import { usePage } from "@inertiajs/react";

interface SalesOrderTemplateProps {
    order: any;
}

export default function SalesOrderTemplate({ order }: SalesOrderTemplateProps) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const day = String(date.getDate()).padStart(2, "0");
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const isEnvasado =
        order.delivery_conditions?.toUpperCase().includes("ENVASAD") ||
        order.packaging?.toUpperCase().includes("ENVASAD");

    const qty = Number(order.total_quantity || 0);
    const totalQty = isEnvasado ? qty * 2 : qty;

    return (
        <div className="sales-order-document font-sans text-black w-full select-text">
            {/* =========================================================================
                PÁGINA 1: ANVERSO (Formato de Orden de Venta)
            ========================================================================= */}
            <div className="print-sheet-front bg-white p-6 md:p-8 print:p-0 mx-auto max-w-[20.5cm] print:max-w-none print:w-full border border-gray-300 shadow-xl print:border-none print:shadow-none mb-10 print:mb-0 box-border flex flex-col justify-between print:min-h-[252mm]">
                <div>
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-4 print:mb-3 w-full">
                        {/* Left side: Logo & Company Red Box */}
                        <div className="w-[53%]">
                            <img
                                src={tenant?.logo || "/images/Proagro2.png"}
                                alt={tenant?.name || "Logo"}
                                className="h-[74px] w-auto object-contain mb-2"
                                onError={(e) => {
                                    e.currentTarget.src = "/img/Proagro2.png";
                                }}
                            />
                            <div className="bg-[#e50019] text-white px-3 py-2 text-[11px] leading-snug font-sans rounded-none shadow-none w-full box-border">
                                <p className="font-bold tracking-tight">PRO-AGROINDUSTRIA PRO140101QY9</p>
                                <p>CARRET COATZ V HERMOSA KM5 SN</p>
                                <p>Adolfo López Mateos</p>
                                <p>Coatzacoalcos,Veracruz,México, C.P. 96490</p>
                            </div>
                        </div>

                        {/* Right side: ORDEN DE VENTA Header & Order details */}
                        <div className="w-[43%]">
                            <div className="bg-[#b3b3b3] text-black text-center py-1.5 font-bold text-xs uppercase tracking-wider mb-2.5 w-full">
                                ORDEN DE VENTA
                            </div>
                            <div className="space-y-1.5 text-xs w-full">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#1b6e3b]">FOLIO:</span>
                                    <span className="font-bold text-black">{order.folio}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#1b6e3b]">FECHA:</span>
                                    <span className="font-bold text-black">{formatDate(order.created_at)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#1b6e3b]">No. DE CLIENTE:</span>
                                    <span className="font-bold text-black">{order.client?.id || ""}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#1b6e3b]">ORDEN DE COMPRA:</span>
                                    <span className="font-bold text-black uppercase">{order.sale_order || ""}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DATOS DEL CLIENTE */}
                    <div className="mb-3.5 print:mb-3 w-full">
                        <div className="bg-[#e50019] text-white text-center py-1 font-bold text-xs uppercase tracking-wider mb-0.5 w-full">
                            DATOS DEL CLIENTE
                        </div>
                        <div className="border border-black p-2.5 text-xs space-y-1.5 w-full box-border">
                            <div className="flex">
                                <span className="font-bold text-[#1b6e3b] w-28 flex-shrink-0">NOMBRE:</span>
                                <span className="font-bold text-black uppercase flex-1">{order.client?.business_name || ""}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold text-[#1b6e3b] w-28 flex-shrink-0">RFC:</span>
                                <span className="font-bold text-black uppercase flex-1">{order.client?.rfc || ""}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold text-[#1b6e3b] w-28 flex-shrink-0">DIRECCIÓN:</span>
                                <span className="font-medium text-black uppercase flex-1 text-[11px] leading-tight">{order.client?.address || ""}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold text-[#1b6e3b] w-28 flex-shrink-0">CONTACTO:</span>
                                <span className="font-medium text-black uppercase flex-1">{order.client?.contact_info || ""}</span>
                            </div>
                        </div>
                    </div>

                    {/* CONDICIONES DE VENTA / ENTREGA */}
                    <div className="border border-black mb-3.5 print:mb-3 flex items-center text-xs w-full box-border">
                        <div className="w-[45%] py-2 px-3 font-bold text-black border-r border-black uppercase text-left">
                            CONDICIONES DE VENTA / ENTREGA
                        </div>
                        <div className="w-[55%] py-2 px-3 font-bold text-black uppercase">
                            {[order.sale_conditions, order.delivery_conditions].filter(Boolean).join(" / ") || "CRÉDITO / ENVASADA"}
                        </div>
                    </div>

                    {/* TABLA DE PRODUCTOS */}
                    <div className="mb-4 print:mb-3.5 w-full">
                        <table className="w-full border-collapse border border-black text-xs">
                            <thead className="bg-[#e50019] text-white text-center">
                                <tr>
                                    <th className="border-r border-black py-1.5 px-3 w-[55%] font-bold uppercase text-xs tracking-wider text-left">
                                        DESCRIPCIÓN DEL PRODUCTO
                                    </th>
                                    <th className="border-r border-black py-1.5 w-[20%] font-bold uppercase text-xs tracking-wider">
                                        UNIDAD
                                    </th>
                                    <th className="py-1.5 px-3 w-[25%] font-bold uppercase text-xs tracking-wider">
                                        CANTIDAD
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-black">
                                    <td className="border-r border-black px-3 py-1.5 font-medium text-black uppercase">
                                        {order.product?.name || "UREA"}
                                    </td>
                                    <td className="border-r border-black py-1.5 text-center font-medium text-black uppercase">
                                        TONELADA
                                    </td>
                                    <td className="px-3 py-1.5 text-center font-medium text-black">
                                        {formatter.format(qty)}
                                    </td>
                                </tr>
                                {isEnvasado && (
                                    <tr className="border-b border-black">
                                        <td className="border-r border-black px-3 py-1.5 font-medium text-black uppercase">
                                            ENVASADO DE {order.product?.name || "UREA"}
                                        </td>
                                        <td className="border-r border-black py-1.5 text-center font-medium text-black uppercase">
                                            SERVICIO
                                        </td>
                                        <td className="px-3 py-1.5 text-center font-medium text-black">
                                            {formatter.format(qty)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="font-bold">
                                    <td className="border-r border-black px-3 py-1.5 text-left uppercase">
                                        MONEDA: Pesos
                                    </td>
                                    <td colSpan={2} className="px-3 py-1.5 text-right uppercase">
                                        TOTAL: {formatter.format(totalQty)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* FIRMAS CON ESPACIO GENEROSO Y FIRMA INTEGRADA */}
                    <div className="flex justify-around items-end pt-3 pb-2 my-3 print:pt-2 print:pb-1 print:my-2 px-6 w-full">
                        <div className="w-64 text-center relative flex flex-col items-center">
                            {/* Firma de Comercialización */}
                            <div className="h-16 w-44 flex items-end justify-center mb-[-12px] relative z-10 pointer-events-none">
                                <img
                                    src="/images/firma_comercializacion.png"
                                    alt="Firma Comercialización"
                                    className="max-h-20 max-w-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.src = "/img/firma_comercializacion.png";
                                    }}
                                />
                            </div>
                            <div className="border-b border-black w-full mb-1.5 relative z-0"></div>
                            <p className="font-bold text-xs uppercase tracking-wider text-black">
                                COMERCIALIZACIÓN
                            </p>
                        </div>
                        <div className="w-64 text-center relative flex flex-col items-center">
                            <div className="h-16 w-full"></div>
                            <div className="border-b border-black w-full mb-1.5"></div>
                            <p className="font-bold text-xs uppercase tracking-wider text-black">
                                CLIENTE
                            </p>
                        </div>
                    </div>

                    {/* POLÍTICAS DE ENTREGA */}
                    <div className="mb-3.5 print:mb-3 w-full">
                        <div className="bg-[#b3b3b3] text-black text-center py-1 font-bold text-xs uppercase tracking-wider mb-1 w-full">
                            POLÍTICAS DE ENTREGA
                        </div>
                        <div className="text-[10px] leading-relaxed text-gray-900 space-y-1 px-1 text-justify">
                            <p>
                                * El cliente es responsable de notificar en tiempo y forma de las unidades autorizadas para el retiro al departamento de logística y suministros, así mismo, de notificar cualquier cambio en las mismas.
                            </p>
                            <p>
                                * Los operadores y unidades para el retiro deberán cumplir con todos los requisitos de seguridad e higiene que marca el reglamento, así también con todos los requisitos documentales necesarios para la carga.
                            </p>
                            <p>
                                * Ante el no ingreso a carga de alguna unidad por incumplimiento de algún requisitio de seguridad o documental no es responsabilidad de Pro-Agroindustria.
                            </p>
                        </div>
                    </div>

                    {/* OBSERVACIONES */}
                    <div className="mb-3 print:mb-2.5 w-full">
                        <div className="bg-[#e50019] text-white text-center py-1 font-bold text-xs uppercase tracking-wider mb-0.5 w-full">
                            OBSERVACIONES
                        </div>
                        <div className="border border-black min-h-[4.5rem] p-2.5 text-xs text-black whitespace-pre-line text-left w-full box-border">
                            {order.observations || order.destination || "Venta de urea agrícola y servicio de envasado en super sacos de 1 tonelada.\nProducto sujeto a crédito por 5 días a partir de la emisión de la factura"}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="w-full mt-2">
                    {/* Paginación Hoja 1 */}
                    <div className="text-right text-[11px] text-gray-800 font-medium mb-1">
                        Hoja 1
                    </div>

                    {/* Footer Anverso */}
                    <div className="border-t border-black pt-2 flex justify-between items-end text-[11px] text-black w-full">
                        <div className="space-y-0.5 text-left">
                            <div>
                                <span className="font-bold">Venta y Cobranza:</span> oscar.mendez@proagroindustria.com
                            </div>
                            <div>
                                <span className="font-bold">Administrativo:</span> jorge.robles@proagroindustria.com
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <img
                                src={tenant?.logo || "/images/Proagro2.png"}
                                alt="Logo"
                                className="h-6 object-contain mb-0.5"
                                onError={(e) => {
                                    e.currentTarget.src = "/img/Proagro2.png";
                                }}
                            />
                            <span className="font-bold tracking-wider text-xs">DCM-FO-001</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                PÁGINA 2: REVERSO (Términos y Condiciones + Aviso de Privacidad)
            ========================================================================= */}
            <div className="print-sheet-back bg-white p-6 md:p-8 print:p-0 mx-auto max-w-[20.5cm] print:max-w-none print:w-full border border-gray-300 shadow-xl print:border-none print:shadow-none mb-10 print:mb-0 box-border print:min-h-[252mm] flex flex-col justify-between">
                <div>
                    <div className="text-center print:hidden mb-4">
                        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full border border-gray-300 uppercase tracking-wider">
                            Reverso de la Orden (Lado 2)
                        </span>
                    </div>

                    <h2 className="text-center font-bold text-xs uppercase tracking-wider mb-3.5 print:mb-3 text-black">
                        TÉRMINOS Y CONDICIONES DE VENTA
                    </h2>

                    <div className="grid grid-cols-2 gap-6 text-[8.8px] print:text-[9.2px] leading-[1.34] text-justify text-black w-full">
                        {/* COLUMNA 1 */}
                        <div className="space-y-2">
                            <p>
                                <span className="font-bold">1. Aceptación de la Orden.</span> Esta Orden se rige por estos Términos y Condiciones (T&amp;C). Cualquier término adicional o diferente propuesto por el Cliente/Usuario queda expresamente rechazado. Pro-Agroindustria, S.A. de C.V. (&quot;Pro-Agro&quot;) solo se obliga a esta Orden tras su aceptación formal.
                            </p>
                            <p>
                                <span className="font-bold">2. Objeto.</span> El objeto de la Orden es la venta de los productos y/o servicios (los &quot;Productos&quot;) descritos en el anverso de este documento.
                            </p>
                            <div>
                                <p className="font-bold">3. Precio y Condiciones de Pago.</p>
                                <p>
                                    <span className="font-semibold">3.1.</span> Los precios se expresan en la moneda indicada en la Orden de Compra del Cliente/Usuario (MXN o USD) y no incluyen IVA, salvo indicación contraria. El precio total definitivo se establecerá en la Factura correspondiente.
                                </p>
                                <p>
                                    <span className="font-semibold">3.2.</span> Las condiciones de pago (contado o crédito) y cualquier anticipo requerido se especificarán en el anverso de esta Orden.
                                </p>
                                <p>
                                    <span className="font-semibold">3.3.</span> En caso de otorgarse crédito, los términos, plazos e intereses moratorios se regirán por el contrato de crédito que las partes suscriban por separado.
                                </p>
                                <p>
                                    <span className="font-semibold">3.4.</span> La Factura correspondiente a la Orden de Venta será emitida por Pro-Agro una vez que se haya acreditado la salida de los productos de las instalaciones, según lo documentado en el Ticket de Pesaje o el Documento de Embarque (Cláusula 4.3).
                                </p>
                            </div>
                            <div>
                                <p className="font-bold">4. Entrega y Riesgo.</p>
                                <p>
                                    <span className="font-semibold">4.1.</span> La entrega de los productos se realizará en la condición &quot;En Fábrica&quot; (INCOTERM EXW) en las instalaciones de Pro-Agro.
                                </p>
                                <p>
                                    <span className="font-semibold">4.2.</span> El Cliente/Usuario es responsable de retirar los productos utilizando personal y unidades autorizadas que cumplan con todas las medidas de seguridad y requisitos documentales de Pro-Agro.
                                </p>
                                <p>
                                    <span className="font-semibold">4.3.</span> El riesgo, la disposición, el traslado, fletes, gastos de exportación/importación y el uso de los productos son responsabilidad exclusiva del Cliente/Usuario a partir del momento en que se acredite la salida de las instalaciones de Pro-Agro, lo cual se confirma mediante el Ticket de Pesaje o el Documento de Embarque correspondiente.
                                </p>
                                <p>
                                    <span className="font-semibold">4.4.</span> Pro-Agro no será responsable por demoras o por la no-entrega si el personal o las unidades del Cliente/Usuario no cumplen con los requisitos de seguridad o documentales exigidos por Pro-Agro.
                                </p>
                            </div>
                            <div>
                                <p className="font-bold">5. Inspección y Recepción.</p>
                                <p>
                                    <span className="font-semibold">5.1.</span> El volumen o cantidad de los productos se determinará utilizando los sistemas de medición certificados de Pro-Agro al momento del retiro.
                                </p>
                                <p>
                                    <span className="font-semibold">5.2.</span> El Cliente/Usuario (o su transportista) deberá verificar los volúmenes en el momento de la carga. La firma del Documento de Embarque y/o el Ticket de Pesaje por parte del transportista constituirá la aceptación total y de conformidad de los volúmenes entregados.
                                </p>
                                <p>
                                    <span className="font-semibold">5.3.</span> No se aceptarán reclamaciones por faltantes de volumen o producto una vez que los productos hayan salido de las instalaciones de Pro-Agro.
                                </p>
                            </div>
                            <div>
                                <p className="font-bold">6. Garantía.</p>
                                <p>
                                    <span className="font-semibold">6.1.</span> Pro-Agro garantiza que los productos entregados cumplen, al momento de la entrega, con las especificaciones de calidad descritas en el Certificado de Calidad, el cual será proporcionado por separado, posterior a la emisión de esta Orden, firmado por la persona facultada del Laboratorio de Calidad.
                                </p>
                                <p>
                                    <span className="font-semibold">6.2.</span> La responsabilidad de Pro-Agro se limita estrictamente a la reposición del Producto que se demuestre no conforme, excluyendo cualquier otra garantía expresa o implícita. Esta garantía no cubre el mal uso, transportación, almacenamiento indebido o alteración del producto por parte del Cliente/Usuario.&quot;
                                </p>
                            </div>
                            <div>
                                <p className="font-bold">7. Modificación de la Orden.</p>
                                <p>
                                    <span className="font-semibold">7.1. Solicitud de Modificación.</span> El Cliente/Usuario podrá solicitar modificaciones a los términos de la Orden previamente aceptada, incluyendo cambios en la cantidad de productos, su presentación (ej. de granel a envasado) o cualquier otra característica. Dicha solicitud deberá realizarse por los medios autorizados por Pro-Agro.
                                </p>
                                <p>
                                    <span className="font-semibold">7.2. Aceptación y Ajuste de Precio.</span> Pro-Agro se reserva el derecho de aceptar o rechazar cualquier solicitud de modificación basada en su viabilidad operativa, disponibilidad de inventario o costos. En caso de ser aceptada, la modificación será ejecutada únicamente tras la aceptación expresa del Cliente/Usuario de la actualización del precio total y las condiciones de pago de la Orden resultante (en armonía con la Cláusula 3).
                                </p>
                                <p>
                                    <span className="font-semibold">7.3. Costos Adicionales Incurridos.</span> Si, a consecuencia de una modificación solicitada por el Cliente/Usuario, Pro-Agro incurre en gastos o costos adicionales de preparación, cambio de envase, adecuación o cualquier
                                </p>
                            </div>
                        </div>

                        {/* COLUMNA 2 */}
                        <div className="space-y-2">
                            <p>
                                otro, el Cliente/Usuario será el único responsable de absorber y pagar la totalidad de dichos costos adicionales ya incurridos por Pro-Agro.
                            </p>
                            <p>
                                <span className="font-semibold">7.4. Aplicación de Costos.</span> Pro-Agro estará facultado para retener, compensar o descontar los costos incurridos mencionados en el punto 7.3 de cualquier anticipo o pago previamente recibido del Cliente/Usuario, sin que este tenga derecho a reclamación o reembolso de dichos gastos.
                            </p>
                            <p>
                                <span className="font-bold">8. Límite de Responsabilidad.</span> La responsabilidad total de Pro-Agro por cualquier reclamación derivada de esta Orden (incluyendo garantía o incumplimiento) se limitará, como máximo, al valor total de los productos pagados por el Cliente/Usuario bajo esta Orden.
                            </p>
                            <p>
                                <span className="font-bold">9. Caso Fortuito o Fuerza Mayor.</span> Pro-Agro no será responsable por demoras o incumplimientos causados por actos de la naturaleza, guerra, pandemias, huelgas, fallas de proveedores, o cualquier causa fuera de su control razonable.
                            </p>
                            <p>
                                <span className="font-bold">10. Ley Aplicable y Jurisdicción.</span> Para la interpretación, cumplimiento y ejecución de esta Orden, las partes se someten expresamente a la jurisdicción de los tribunales federales competentes en la Ciudad de México, renunciando en consecuencia a cualquier fuero que debido a su domicilio presente o futuro pudiera corresponderles.
                            </p>
                            <p>
                                <span className="font-bold">11. Validez de la Aceptación Electrónica y Digital.</span> Para la aceptación de estos Términos y Condiciones (T&amp;C), Aviso de Privacidad, así como de la Orden, cualquier consentimiento, aprobación, modificación o documentos relacionados, el Cliente/Usuario acepta que su manifestación de voluntad podrá realizarse por medios electrónicos, digitales, numéricos, alfanuméricos, huellas de voz, biométricos o de cualquier otra forma tecnológica que sea puesta a su disposición. Dichos medios alternativos de firma o aceptación y los registros en donde sean aplicados, serán considerados para todos los efectos legales, con la misma fuerza y consecuencias que la firma autógrafa original física de la parte firmante. Lo anterior incluye, pero no se limita, a lo dispuesto en la legislación civil, mercantil, de protección al consumidor y a la NOM-151-SCFI-2016 (Requisitos que deben observarse para la conservación de mensajes de datos y digitalización de documentos).
                            </p>

                            {/* AVISO DE PRIVACIDAD */}
                            <div className="border-t border-black my-2.5 pt-2">
                                <h3 className="text-center font-bold text-[9px] uppercase tracking-wider mb-1.5 text-black">
                                    AVISO DE PRIVACIDAD
                                </h3>
                                <div className="space-y-1.5 text-[8.2px] print:text-[8.5px] leading-[1.28]">
                                    <p>
                                        Pro-Agroindustria, S.A. de C.V. (&quot;Pro-Agro&quot;), con domicilio en Carretera Coatzacoalcos, Villahermosa, Km. 5, Col. Adolfo López Mateos, Coatzacoalcos, Veracruz, C.P. 96490, es el responsable del uso y protección de sus datos personales.
                                    </p>
                                    <p>
                                        Sus datos serán utilizados para las finalidades necesarias derivadas de esta Orden de Venta, incluyendo: verificar su identidad, gestionar la relación contractual y administrativa, cumplir con obligaciones legales y auditorías.
                                    </p>
                                    <p>
                                        Le informamos que sus datos personales podrán ser transferidos a Petróleos Mexicanos (PEMEX), sus Empresas Productivas Subsidiarias y/o Filiales, siendo esto necesario para la relación contractual. Si usted no manifiesta expresamente su oposición, se entenderá que consiente dicha transferencia.
                                    </p>
                                    <p>
                                        Usted tiene derecho a ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) o revocar su consentimiento. Para ello, debe presentar una solicitud por correo electrónico a: diana.amador@proagroindustria.com y/o alvaro.reyes@proagroindustria.com.
                                    </p>
                                    <p>
                                        Puede solicitar nuestro Aviso de Privacidad Integral completo a los mismos correos o consultarlo en nuestro domicilio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
