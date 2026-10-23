import React, { useState, useRef, useEffect } from 'react';
import { Building2, Search, Check, CheckCheck, X, ChevronDown, Building } from 'lucide-react';

export interface ClientItem {
    id: number;
    business_name: string;
    rfc?: string;
}

interface ClientMultiSelectProps {
    clients: ClientItem[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    label?: string;
    error?: string;
    placeholder?: string;
}

export default function ClientMultiSelect({
    clients = [],
    selectedIds = [],
    onChange,
    label = "Clientes:",
    error,
    placeholder = "SELECCIONE CLIENTES...",
}: ClientMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 280 && rect.top > 300) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
        setIsOpen(!isOpen);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredClients = clients.filter(c => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
            c.business_name.toLowerCase().includes(q) ||
            (c.rfc && c.rfc.toLowerCase().includes(q))
        );
    });

    const isAllSelected = clients.length > 0 && selectedIds.length === clients.length;

    const handleSelectAll = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(clients.map(c => c.id));
    };

    const handleDeselectAll = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange([]);
    };

    const toggleClient = (id: number) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(item => item !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const removeClient = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(selectedIds.filter(item => item !== id));
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-bold text-gray-700">{label}</label>
                    {clients.length > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                            {selectedIds.length === clients.length ? (
                                <span className="text-emerald-600 font-bold">Todos seleccionados ({clients.length})</span>
                            ) : (
                                <span>{selectedIds.length} de {clients.length} seleccionados</span>
                            )}
                        </span>
                    )}
                </div>
            )}

            {/* Selector Button */}
            <div
                onClick={handleToggle}
                className={`w-full min-h-[42px] rounded-lg border shadow-sm py-2 pl-10 pr-10 cursor-pointer transition-all relative flex flex-wrap items-center gap-1.5 ${
                    isOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500 bg-white'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
            >
                <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />

                {selectedIds.length === 0 ? (
                    <span className="text-gray-400 text-sm select-none">{placeholder}</span>
                ) : isAllSelected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCheck className="w-3.5 h-3.5" />
                        TODOS LOS CLIENTES ({clients.length})
                    </span>
                ) : (
                    <div className="flex flex-wrap gap-1 max-w-[calc(100%-2rem)]">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {selectedIds.length} cliente{selectedIds.length > 1 ? 's' : ''} seleccionado{selectedIds.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                <div className="absolute right-3 top-2.5 flex items-center text-gray-400 pointer-events-none">
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute z-[70] left-0 right-0 ${
                        openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
                    } bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in duration-150`}
                >
                    {/* Search Bar */}
                    <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar cliente por nombre o RFC..."
                                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
                            {search && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearch('');
                                    }}
                                    className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Selection Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Seleccionar todos ({clients.length})
                            </button>

                            {selectedIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Deseleccionar todos
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Clients List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 p-1">
                        {filteredClients.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500">
                                No se encontraron clientes que coincidan con "{search}"
                            </div>
                        ) : (
                            filteredClients.map((client) => {
                                const isChecked = selectedIds.includes(client.id);
                                return (
                                    <div
                                        key={client.id}
                                        onClick={() => toggleClient(client.id)}
                                        className={`px-3 py-2 flex items-center gap-3 cursor-pointer rounded-lg transition-colors ${
                                            isChecked
                                                ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                                                : 'hover:bg-gray-50 text-gray-800'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}} // Handled by parent div
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold uppercase truncate">{client.business_name}</p>
                                            {client.rfc && (
                                                <p className="text-[10px] text-gray-500 font-mono">RFC: {client.rfc}</p>
                                            )}
                                        </div>
                                        {isChecked && (
                                            <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs px-3">
                        <span className="text-gray-500 font-medium">
                            {selectedIds.length === clients.length && clients.length > 0 ? (
                                <span className="text-emerald-600 font-bold">Todos seleccionados ({clients.length})</span>
                            ) : (
                                <span>{selectedIds.length} de {clients.length} seleccionados</span>
                            )}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}

            {/* Selected badges display under the field */}
            {selectedIds.length > 0 && !isAllSelected && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50/60 rounded-lg border border-gray-100">
                    {selectedIds.map(id => {
                        const client = clients.find(c => c.id === id);
                        if (!client) return null;
                        return (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-gray-800 border border-gray-200 shadow-xs"
                            >
                                <span className="truncate max-w-[200px]" title={client.business_name}>
                                    {client.business_name}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => removeClient(e, id)}
                                    className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                                    title="Quitar cliente"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
