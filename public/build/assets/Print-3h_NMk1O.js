import{X as n,r as m,j as t,S as s,x as p}from"./app-BY8xYdIB.js";import{S as d}from"./SalesOrderTemplate-DMfIQAfL.js";import l from"./sweetalert2.esm.all-C-gltHdU.js";import{A as c}from"./arrow-left-opO0SPO1.js";import{P as b}from"./printer-Dh8Ns42P.js";import"./createLucideIcon-3lP7ZVkN.js";function j({order:o}){const{props:a}=n(),r=a.tenant;return m.useEffect(()=>{try{l.close(),document.body.classList.remove("swal2-shown","swal2-height-auto"),document.querySelectorAll(".swal2-container").forEach(e=>e.remove())}catch{}const i=setTimeout(()=>{window.print()},600);return()=>clearTimeout(i)},[]),t.jsxs("div",{className:"bg-gray-100 min-h-screen p-4 md:p-8 print:p-0 print:bg-white text-black font-sans",children:[t.jsx(s,{title:`Orden de Venta - ${o.folio} - ${(r==null?void 0:r.name)||"VECODE"}`}),t.jsxs("div",{className:"no-print print:hidden max-w-5xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200",children:[t.jsxs(p,{href:route("sales.orders.index"),className:"inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors",children:[t.jsx(c,{className:"w-4 h-4"}),"Volver a Órdenes de Venta"]}),t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("span",{className:"text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200",children:o.folio}),t.jsxs("button",{type:"button",onClick:()=>window.print(),style:{backgroundColor:(r==null?void 0:r.primary_color)||"#15803d"},className:"inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 transition shadow-sm cursor-pointer",children:[t.jsx(b,{className:"w-4 h-4"}),"Imprimir Formato"]})]})]}),t.jsx("div",{className:"max-w-5xl mx-auto print:max-w-none print:m-0 print:p-0 print:w-full",children:t.jsx(d,{order:o})}),t.jsx("style",{children:`
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
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    body.swal2-shown {
                        overflow: visible !important;
                    }
                    .swal2-container,
                    .swal2-backdrop-show,
                    .swal2-popup,
                    .no-print,
                    .print\\:hidden,
                    nav,
                    header,
                    footer,
                    aside { 
                        display: none !important; 
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
                        display: block !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        page-break-after: always !important; 
                        break-after: page !important;
                        box-sizing: border-box !important;
                    }
                    .print-sheet-back { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        min-width: 0 !important;
                        display: block !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
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
            `})]})}export{j as default};
