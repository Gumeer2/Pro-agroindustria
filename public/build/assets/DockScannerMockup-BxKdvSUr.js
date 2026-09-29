import{r,j as e}from"./app-BVnFr51w.js";import{A as x}from"./anchor-DfMpza5E.js";import{S as m}from"./ship-DcACk8J9.js";import{I as f}from"./info-DKdUD53m.js";import{T as j}from"./truck-GdNOXGt3.js";import{C as N}from"./circle-check-CmRfZeWa.js";import{Q as n}from"./qr-code-DAmytBZ0.js";import{C as v}from"./circle-alert-DPQLGYcT.js";import"./createLucideIcon-CZCXppEk.js";const E=()=>{const[p,o]=r.useState(null),[a,c]=r.useState(!1),[t,i]=r.useState(null),[d,b]=r.useState([{id:1,name:"Bodega 1",status:"full",progress:100,product:"Maíz Amarillo"},{id:2,name:"Bodega 2",status:"loading",progress:45,product:"Trigo"},{id:3,name:"Bodega 3",status:"empty",progress:0,product:"-"},{id:4,name:"Bodega 4",status:"loading",progress:12,product:"Soya"},{id:5,name:"Bodega 5",status:"empty",progress:0,product:"-"}]),u=()=>{c(!0),setTimeout(()=>{c(!1),i({unit:"UTC-124",operator:"Carlos Mendoza",product:"Trigo",weight:"32.50 Ton",type:"Descarga"})},1500)},g=s=>{t&&(b(h=>h.map(l=>l.id===s?{...l,status:"loading",progress:Math.min(l.progress+5,100),product:t.product}:l)),i(null),o(null))};return e.jsxs("div",{className:"min-h-screen bg-slate-900 text-white p-6 font-sans",children:[e.jsxs("header",{className:"flex justify-between items-center mb-8 border-b border-slate-700 pb-4",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-2xl font-bold flex items-center gap-2",children:[e.jsx(x,{className:"text-blue-400"}),"Escáner de Bodegas ",e.jsx("span",{className:"text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded uppercase tracking-wider",children:"Muelle - Ejemplo"})]}),e.jsx("p",{className:"text-slate-400 text-sm mt-1",children:"Control de Carga/Descarga en Tiempo Real"})]}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-xs text-slate-500 uppercase",children:"Barco en Muelle"}),e.jsx("p",{className:"font-semibold text-blue-300",children:"YASA ROSE"})]}),e.jsx("div",{className:"h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30",children:e.jsx(m,{size:20,className:"text-blue-400"})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-8",children:[e.jsxs("div",{className:"lg:col-span-2 space-y-6",children:[e.jsxs("div",{className:"bg-slate-800/50 rounded-2xl border border-slate-700 p-8 relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-0 p-4 opacity-10",children:e.jsx(m,{size:200})}),e.jsxs("h2",{className:"text-lg font-semibold mb-6 flex items-center gap-2",children:[e.jsx(f,{size:18,className:"text-slate-500"}),"Mapa de Estiba Interactivo"]}),e.jsx("div",{className:"relative py-12 flex justify-center",children:e.jsxs("div",{className:"relative w-full max-w-2xl h-32 bg-slate-700 rounded-full flex items-center px-12 border-4 border-slate-600 shadow-2xl",children:[e.jsx("div",{className:"absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-600 transform rotate-45 rounded-sm shadow-lg"}),e.jsx("div",{className:"absolute -right-2 top-0 bottom-0 w-16 bg-slate-600 rounded-r-full border-l border-slate-500"}),e.jsx("div",{className:"flex-1 grid grid-cols-5 gap-3 h-20 z-10",children:d.map(s=>e.jsxs("button",{onClick:()=>o(s.id),className:`relative rounded-lg border-2 transition-all duration-300 overflow-hidden group
                                                ${p===s.id?"border-blue-400 scale-105 shadow-[0_0_15px_rgba(96,165,250,0.5)]":"border-slate-500 hover:border-slate-400"}
                                                ${s.status==="full"?"bg-green-500/20":s.status==="loading"?"bg-blue-500/20":"bg-slate-800/40"}
                                            `,children:[e.jsx("div",{className:`absolute bottom-0 left-0 right-0 transition-all duration-1000 border-t 
                                                    ${s.status==="full"?"bg-green-500/40 border-green-400":"bg-blue-500/40 border-blue-400"}`,style:{height:`${s.progress}%`}}),e.jsxs("span",{className:"relative z-20 text-[10px] font-bold uppercase block text-center mt-6",children:["B",s.id]}),s.status==="loading"&&e.jsx("div",{className:"absolute top-1 right-1",children:e.jsx("div",{className:"w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"})})]},s.id))})]})}),e.jsx("div",{className:"grid grid-cols-5 gap-4 mt-8",children:d.map(s=>e.jsxs("div",{className:"text-center",children:[e.jsx("p",{className:"text-[10px] text-slate-500 uppercase font-bold",children:s.name}),e.jsx("div",{className:"h-1.5 w-full bg-slate-700 rounded-full mt-1 overflow-hidden",children:e.jsx("div",{className:`h-full transition-all duration-500 ${s.status==="full"?"bg-green-500":"bg-blue-500"}`,style:{width:`${s.progress}%`}})}),e.jsxs("p",{className:"text-xs mt-1 font-mono",children:[s.progress,"%"]})]},s.id))})]}),e.jsxs("div",{className:"bg-slate-800/30 rounded-2xl border border-slate-700 p-6",children:[e.jsx("h3",{className:"text-sm font-bold text-slate-400 uppercase tracking-widest mb-4",children:"Actividad Reciente"}),e.jsx("div",{className:"space-y-3",children:[1,2].map(s=>e.jsxs("div",{className:"flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center",children:e.jsx(j,{size:16,className:"text-green-400"})}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("p",{className:"text-sm font-medium",children:["Unidad UTC-087 completó descarga en ",e.jsx("span",{className:"text-blue-400",children:"Bodega 2"})]}),e.jsx("p",{className:"text-[10px] text-slate-500",children:"Hace 4 minutos"})]}),e.jsx(N,{size:16,className:"text-green-500"})]},s))})]})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"bg-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-xl",children:[e.jsxs("div",{className:"p-4 bg-slate-700/50 border-b border-slate-600 flex justify-between items-center",children:[e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-slate-300",children:"Módulo de Escaneo"}),e.jsx("div",{className:"w-2 h-2 rounded-full bg-green-500 animate-pulse"})]}),e.jsx("div",{className:"p-6 flex flex-col items-center",children:t?e.jsxs("div",{className:"w-full space-y-4 animate-in fade-in slide-in-from-bottom-4",children:[e.jsxs("div",{className:"p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl",children:[e.jsxs("div",{className:"flex justify-between items-start mb-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] text-blue-400 uppercase font-bold",children:"Unidad Identificada"}),e.jsx("h4",{className:"text-xl font-bold",children:t.unit})]}),e.jsx("span",{className:"bg-blue-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase",children:t.type})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 text-sm",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-slate-500 text-[10px]",children:"OPERADOR"}),e.jsx("p",{className:"font-semibold",children:t.operator})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-slate-500 text-[10px]",children:"PRODUCTO"}),e.jsx("p",{className:"font-semibold",children:t.product})]})]})]}),e.jsxs("div",{className:"pt-4",children:[e.jsxs("p",{className:"text-xs font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase",children:[e.jsx(v,{size:14,className:"text-amber-400"}),"Seleccionar Bodega de Destino"]}),e.jsx("div",{className:"grid grid-cols-3 gap-2",children:d.map(s=>e.jsxs("button",{onClick:()=>g(s.id),className:`py-3 rounded-lg border font-bold text-sm transition-all
                                                        ${s.status==="full"?"opacity-30 cursor-not-allowed bg-slate-900 border-slate-800":"bg-slate-700 border-slate-600 hover:bg-blue-600 hover:border-blue-400"}
                                                    `,children:["B",s.id]},s.id))})]}),e.jsx("button",{onClick:()=>i(null),className:"w-full py-2 text-xs text-slate-500 hover:text-white transition-colors",children:"Cancelar Operación"})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:`w-48 h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500
                                        ${a?"border-blue-400 bg-blue-500/5":"border-slate-600 bg-slate-900/50"}
                                    `,children:[a?e.jsxs("div",{className:"relative",children:[e.jsx(n,{size:64,className:"text-blue-400 opacity-20"}),e.jsx("div",{className:"absolute inset-0 border-t-2 border-blue-400 animate-scan"})]}):e.jsx(n,{size:64,className:"text-slate-600"}),e.jsx("p",{className:"text-[10px] mt-4 text-slate-500 uppercase font-bold tracking-widest",children:"Esperando QR..."})]}),e.jsxs("button",{onClick:u,disabled:a,className:"mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40",children:[e.jsx(n,{size:20}),a?"Escaneando...":"Simular Escaneo"]})]})})]}),e.jsxs("div",{className:"bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-xl shadow-blue-900/20 relative overflow-hidden",children:[e.jsx("div",{className:"absolute -right-4 -bottom-4 opacity-10",children:e.jsx(x,{size:120})}),e.jsx("p",{className:"text-blue-100/70 text-xs font-bold uppercase tracking-widest mb-1",children:"Carga Total Buque"}),e.jsxs("h4",{className:"text-3xl font-bold text-white mb-4",children:["1,420.30",e.jsx("span",{className:"text-sm ml-1 font-normal opacity-70",children:"TON"})]}),e.jsx("div",{className:"h-2 w-full bg-white/20 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-white w-[64%] shadow-[0_0_10px_white]"})}),e.jsxs("div",{className:"flex justify-between mt-2 text-[10px] font-bold text-blue-100/60 uppercase",children:[e.jsx("span",{children:"Descargado: 34k Ton"}),e.jsx("span",{children:"Total Barco: 52k Ton"})]})]})]})]}),e.jsx(w,{}),e.jsx("style",{children:`
                @keyframes scan {
                    0%, 100% { top: 0; }
                    50% { top: 100%; }
                }
                .animate-scan {
                    position: absolute;
                    width: 100%;
                    animation: scan 2s ease-in-out infinite;
                }

                /* Dragon 3D Animations */
                .dragon-container {
                    position: fixed;
                    top: -100px;
                    left: -100px;
                    width: 150px;
                    height: 150px;
                    z-index: 9999;
                    pointer-events: none;
                    perspective: 1000px;
                    animation: fly-path 25s linear infinite;
                    transform-style: preserve-3d;
                }

                .dragon-body {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transform-style: preserve-3d;
                    animation: bob 2s ease-in-out infinite;
                }

                .wing {
                    position: absolute;
                    top: 20%;
                    width: 80px;
                    height: 50px;
                    background: #e11d48;
                    clip-path: polygon(0% 0%, 100% 50%, 0% 100%, 20% 50%);
                    transform-origin: left center;
                }

                .wing-left {
                    left: 20%;
                    animation: flap-left 0.4s ease-in-out infinite;
                }

                .wing-right {
                    left: 20%;
                    animation: flap-right 0.4s ease-in-out infinite;
                    transform: scaleX(-1);
                }

                .dragon-head {
                    position: absolute;
                    top: 10%;
                    left: 60%;
                    width: 40px;
                    height: 40px;
                    background: #fbbf24;
                    border-radius: 50% 50% 20% 20%;
                    transform: rotateY(20deg);
                }

                .fire-breath {
                    position: absolute;
                    top: 50%;
                    left: 100%;
                    width: 0;
                    height: 20px;
                    background: linear-gradient(90deg, #f59e0b, #ef4444);
                    border-radius: 0 50% 50% 0;
                    opacity: 0;
                    filter: blur(4px);
                    animation: spit-fire 5s infinite;
                }

                @keyframes fly-path {
                    0% { transform: translate(0, 0) rotateY(0deg) scale(0.5); }
                    25% { transform: translate(80vw, 20vh) rotateY(180deg) scale(1.2); }
                    50% { transform: translate(20vw, 80vh) rotateY(0deg) scale(0.8); }
                    75% { transform: translate(90vw, 70vh) rotateY(180deg) scale(1.5); }
                    100% { transform: translate(0, 0) rotateY(0deg) scale(0.5); }
                }

                @keyframes flap-left {
                    0%, 100% { transform: rotateY(-40deg) rotateX(30deg); }
                    50% { transform: rotateY(-40deg) rotateX(-60deg); }
                }

                @keyframes flap-right {
                    0%, 100% { transform: scaleX(-1) rotateY(-40deg) rotateX(30deg); }
                    50% { transform: scaleX(-1) rotateY(-40deg) rotateX(-60deg); }
                }

                @keyframes bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                @keyframes spit-fire {
                    0%, 80%, 100% { width: 0; opacity: 0; }
                    85% { width: 100px; opacity: 1; }
                    95% { width: 120px; opacity: 0.8; }
                }
            `})]})},w=()=>e.jsx("div",{className:"dragon-container",children:e.jsxs("div",{className:"dragon-body",children:[e.jsx("div",{className:"wing wing-left"}),e.jsx("div",{className:"wing wing-right"}),e.jsx("div",{className:"absolute top-1/2 left-0 w-20 h-12 bg-rose-600 rounded-full transform -translate-y-1/2"}),e.jsxs("div",{className:"dragon-head",children:[e.jsx("div",{className:"absolute top-2 left-6 w-2 h-2 bg-black rounded-full"}),e.jsx("div",{className:"fire-breath"})]}),e.jsx("div",{className:"absolute top-1/2 -left-10 w-16 h-6 bg-rose-700 rounded-full origin-right animate-bounce"})]})});export{E as default};
