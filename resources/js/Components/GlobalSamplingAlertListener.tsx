import React, { useEffect, useState, useRef, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldAlert, Unlock, ArrowRight, X } from 'lucide-react';

interface BlockedItem {
    id: string | number;
    shipment_order_id?: string | number;
    folio: string;
    operator: string;
    warehouse: string;
    squad_leader: string;
    reason?: string;
    blocked_at?: string;
}

export function GlobalSamplingAlertListener() {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const userRoles: any[] = user?.roles || [];
    const isAdmin = useMemo(() => {
        return (
            userRoles.some((r: any) => {
                const name = (typeof r === 'string' ? r : r.name || '').toLowerCase();
                return name === 'admin' || name === 'administrador' || name === 'super-admin';
            }) ||
            Boolean(user?.is_admin) ||
            (user?.name || '').toLowerCase().includes('admin')
        );
    }, [userRoles, user]);

    const isEstibador = useMemo(() => {
        if (isAdmin) return false;
        return userRoles.some((r: any) => {
            const name = (typeof r === 'string' ? r : r.name || '').toLowerCase();
            return name === 'estibador' || name === 'estibadores';
        });
    }, [userRoles, isAdmin]);

    const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const knownBlockedIdsRef = useRef<Set<string>>(new Set());
    const isInitialFetchRef = useRef(true);

    const playAlertSound = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const audioCtx = new AudioContextClass();
            const now = audioCtx.currentTime;

            // Primer tono (D5)
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now);
            gain1.gain.setValueAtTime(0.18, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.22);

            // Segundo tono (A5)
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, now + 0.16);
            gain2.gain.setValueAtTime(0.22, now + 0.16);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now + 0.16);
            osc2.stop(now + 0.45);
        } catch (e) {
            // Audio context safely ignored if restricted by browser policy
        }
    };

    const handleUnlockItem = (item: BlockedItem) => {
        setIsMenuOpen(false);
        const targetId = item.id || item.shipment_order_id || item.folio;
        const currentPath = window.location.pathname;

        if (currentPath.includes('/apt/shipment-process')) {
            window.dispatchEvent(
                new CustomEvent('open-sampling-modal', {
                    detail: { id: item.id, shipment_order_id: item.shipment_order_id, folio: item.folio },
                })
            );
        } else {
            router.visit(route('apt.shipment-process') + '?openSampling=' + encodeURIComponent(item.folio || String(targetId)));
        }
    };

    const checkActiveBlocks = async () => {
        if (!user || isEstibador) return;

        try {
            const response = await axios.get(route('documentation.shipment-orders.active-sampling-blocks'));
            const data: BlockedItem[] = Array.isArray(response.data) ? response.data : [];
            setBlockedItems(data);

            const currentIds = new Set(data.map((d) => String(d.id || d.shipment_order_id || d.folio)));

            // Si no es la primera carga inicial, detectar si hay nuevas órdenes bloqueadas
            if (!isInitialFetchRef.current) {
                const newlyBlocked = data.filter(
                    (d) => !knownBlockedIdsRef.current.has(String(d.id || d.shipment_order_id || d.folio))
                );

                if (newlyBlocked.length > 0) {
                    playAlertSound();
                    const target = newlyBlocked[0];

                    if (!Swal.isVisible()) {
                        Swal.fire({
                            icon: 'warning',
                            title: `<span style="color:#b91c1c; font-weight:800; font-size:22px;">⚠️ Muestreo Bloqueado: ${target.folio}</span>`,
                            html: `
                                <div style="text-align: center; font-size: 14px; line-height: 1.5; color: #1e293b; margin-top: 6px;">
                                    El personal estibador ha registrado un peso fuera de tolerancia en la orden <strong>${target.folio}</strong> y la toma de muestras ha quedado <strong>BLOQUEADA</strong>.
                                </div>
                            `,
                            showCancelButton: true,
                            showDenyButton: true,
                            confirmButtonText: 'Desbloquear',
                            denyButtonText: 'Ir al Proceso',
                            cancelButtonText: 'Cerrar',
                            confirmButtonColor: '#e11d48',
                            denyButtonColor: '#4338ca',
                            cancelButtonColor: '#64748b',
                            backdrop: 'rgba(15, 23, 42, 0.45)',
                            customClass: { container: '!z-[999999]' }
                        }).then((result) => {
                            if (result.isConfirmed) {
                                handleUnlockItem(target);
                            } else if (result.isDenied) {
                                router.visit(route('apt.shipment-process'));
                            }
                        });
                    }
                }
            }

            knownBlockedIdsRef.current = currentIds;
            isInitialFetchRef.current = false;
        } catch (error) {
            // Silencioso ante fallos de conexión esporádicos
        }
    };

    useEffect(() => {
        if (!user || isEstibador) return;

        checkActiveBlocks();

        const interval = setInterval(() => {
            checkActiveBlocks();
        }, 3500);

        const handleExternalUnlock = () => {
            checkActiveBlocks();
        };

        window.addEventListener('sampling-unlocked', handleExternalUnlock);

        return () => {
            clearInterval(interval);
            window.removeEventListener('sampling-unlocked', handleExternalUnlock);
        };
    }, [user?.id, isEstibador]);

    if (!user || isEstibador) {
        return null;
    }

    if (blockedItems.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Botón Indicador de Bloqueo en la Barra Superior */}
            <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition transform active:scale-95 animate-pulse cursor-pointer border border-rose-400"
                title={`${blockedItems.length} orden(es) con muestreo bloqueado esperando autorización`}
            >
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                <span>
                    {blockedItems.length} {blockedItems.length === 1 ? 'Muestreo Bloqueado' : 'Muestreos Bloqueados'}
                </span>
                <span className="bg-white text-rose-700 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold">
                    {blockedItems.length}
                </span>
            </button>

            {/* Menú Desplegable con las Órdenes Bloqueadas */}
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border-2 border-rose-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                            <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider">
                                Órdenes con Muestreo Bloqueado
                            </h4>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {blockedItems.map((item) => (
                            <div
                                key={item.id || item.folio}
                                className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col gap-2 hover:bg-rose-50 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-sm text-rose-950 font-mono">
                                        {item.folio}
                                    </span>
                                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md">
                                        {item.warehouse || 'Almacén 01'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-700">
                                    <p className="truncate"><strong>Op:</strong> {item.operator}</p>
                                    <p className="text-[11px] text-gray-500 truncate"><strong>Líder:</strong> {item.squad_leader}</p>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.visit(route('apt.shipment-process'));
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-bold hover:underline"
                                    >
                                        <span>Ir al Proceso</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            handleUnlockItem(item);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm transition cursor-pointer"
                                    >
                                        <Unlock className="w-3 h-3" />
                                        <span>Desbloquear</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
