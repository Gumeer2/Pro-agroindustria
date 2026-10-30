import{X as l,j as t,S as c,x as b}from"./app-XANsw4So.js";import{D as x}from"./DashboardLayout-BD_2tiSz.js";import{S as u}from"./SalesOrderTemplate-BPgkFYXe.js";import{A as h}from"./arrow-left-B0yqZBOl.js";import{P as g}from"./printer-J4xaDBdK.js";import"./createLucideIcon-Cxkf0g90.js";import"./truck-Cjtgsoly.js";import"./search-DE33c3WG.js";import"./ship-BSAehqLS.js";import"./box-7kNMjDVu.js";import"./x-KUkjR6jT.js";function E({auth:m,order:r,context_module:o}){const{props:s}=l(),e=s.tenant,a=o==="documentation",i=o==="sales_from_documentation",n=o==="sales_report",p=i?route("sales.orders.index",{from:"documentation"}):a?route("documentation.orders.index"):n?route("sales.index",{view:"report"}):route("sales.orders.index"),d=i?"Volver a Órdenes de Venta":a?"Volver al reporte de embarque":n?"Volver al reporte de ventas":"Volver al listado";return t.jsxs(x,{user:m.user,header:`Orden: ${r.folio}`,children:[t.jsx(c,{title:`Orden ${r.folio} - ${(e==null?void 0:e.name)||"VECODE"}`}),t.jsxs("div",{className:"max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:max-w-none print:w-full",children:[t.jsxs("div",{className:"mb-6 flex justify-between items-center print:hidden",children:[t.jsxs(b,{href:p,className:"text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors",children:[t.jsx(h,{className:"w-4 h-4 mr-1"}),d]}),t.jsxs("div",{className:"flex items-center gap-4",children:[t.jsx("span",{className:`text-xs font-bold px-3 py-1 rounded-full border ${r.status==="created"?"bg-blue-50 text-blue-700 border-blue-200":r.status==="closed"?"bg-red-50 text-red-700 border-red-200":"bg-green-50 text-green-700 border-green-200"}`,children:r.status==="created"?"ABIERTA":r.status==="closed"?"CERRADA":r.status}),t.jsxs("button",{onClick:()=>window.print(),style:{backgroundColor:(e==null?void 0:e.primary_color)||"#15803d"},className:"inline-flex items-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white hover:opacity-90 transition-all font-sans uppercase tracking-widest cursor-pointer",children:[t.jsx(g,{className:"w-4 h-4 mr-2"}),"Imprimir OV"]})]})]}),t.jsx(u,{order:r})]}),t.jsx("style",{children:`
                @media print {
                    @page { 
                        size: letter portrait;
                        margin: 8mm 10mm 8mm 10mm;
                    }
                    html, body { 
                        background: white !important; 
                        color: black !important;
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    nav, header, footer, aside, .print\\:hidden, #sidebar, .sidebar { 
                        display: none !important; 
                    }
                    main, .min-h-screen, .flex-1 { 
                        display: block !important;
                        padding: 0 !important; 
                        margin: 0 !important; 
                        width: 100% !important;
                        min-height: auto !important;
                        max-width: none !important;
                        overflow: visible !important;
                    }
                    .sales-order-document {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-sheet-front { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        min-width: 0 !important;
                        min-height: 252mm !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        page-break-after: always !important; 
                        break-after: page !important;
                        box-sizing: border-box !important;
                    }
                    .print-sheet-back { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        min-width: 0 !important;
                        min-height: 252mm !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        page-break-before: always !important; 
                        break-before: page !important;
                        box-sizing: border-box !important;
                    }
                    .bg-\\[\\#e50019\\] { 
                        background-color: #e50019 !important; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    .bg-\\[\\#b3b3b3\\] { 
                        background-color: #b3b3b3 !important; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    .text-\\[\\#1b6e3b\\] { 
                        color: #1b6e3b !important; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                }
            `})]})}export{E as default};
