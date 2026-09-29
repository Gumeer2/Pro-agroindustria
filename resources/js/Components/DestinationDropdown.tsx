import React, { useState, useEffect, Fragment } from 'react';
import { Listbox, Transition, Dialog } from '@headlessui/react';
import {
    Check,
    ChevronsUpDown,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    MapPin
} from 'lucide-react';
import axios from 'axios';

interface Destination {
    id: number;
    name: string;
}

interface DestinationDropdownProps {
    value?: number | string;
    initialDestinations?: Destination[];
    onChange: (id: number) => void;
    label?: string;
    error?: string;
}

export default function DestinationDropdown({ value, initialDestinations = [], onChange, label = "Destino", error }: DestinationDropdownProps) {
    const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchDestinations = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('shipment-destinations.index'));
            if (Array.isArray(response.data)) {
                setDestinations(response.data);
            }
        } catch (error) {
            console.error("Error fetching destinations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDestinations();
    }, []);

    useEffect(() => {
        if (initialDestinations && initialDestinations.length > 0) {
            setDestinations(initialDestinations);
        }
    }, [initialDestinations]);

    const handleSave = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        try {
            let savedId: number | null = null;
            if (editingDestination) {
                const resp = await axios.put(route('shipment-destinations.update', editingDestination.id), { name: newName.trim() });
                savedId = resp.data?.id;
            } else {
                const resp = await axios.post(route('shipment-destinations.store'), { name: newName.trim() });
                savedId = resp.data?.id;
            }
            await fetchDestinations();
            if (savedId) {
                onChange(savedId);
            }
            closeDialog();
        } catch (error: any) {
            const errorMsg = error.response?.data?.errors?.name?.[0] || error.response?.data?.message || "Error al guardar destino";
            alert(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, destination: Destination) => {
        e.stopPropagation();
        if (!confirm(`¿Estás seguro de eliminar "${destination.name}"?`)) return;
        try {
            await axios.delete(route('shipment-destinations.destroy', destination.id));
            if (Number(value) === destination.id) {
                const firstOther = destinations.find(d => d.id !== destination.id);
                if (firstOther) onChange(firstOther.id);
            }
            await fetchDestinations();
        } catch (error) {
            console.error("Error deleting destination:", error);
            alert("Error al eliminar destino");
        }
    };

    const openDialog = (destination: Destination | null = null) => {
        setEditingDestination(destination);
        setNewName(destination ? destination.name : "");
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingDestination(null);
        setNewName("");
    };

    const selectedDestination = destinations.find(d => d.id === Number(value));

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <Listbox value={value} onChange={(val) => onChange(Number(val))}>
                <div className="relative mt-1">
                    <Listbox.Button className={`relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <MapPin className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                        <span className={`block truncate font-medium ${selectedDestination ? 'text-gray-900' : 'text-gray-400'}`}>
                            {selectedDestination?.name || "Seleccione destino..."}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => openDialog()}
                                    className="flex w-full items-center px-4 py-2.5 text-indigo-600 hover:bg-indigo-50 font-bold transition-colors"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Nuevo Destino
                                </button>
                            </div>

                            {loading && destinations.length === 0 ? (
                                <div className="px-4 py-2 text-gray-400 italic">Cargando...</div>
                            ) : (
                                destinations.map((destination) => (
                                    <Listbox.Option
                                        key={destination.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2.5 pl-10 pr-20 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={destination.id}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                                    {destination.name}
                                                </span>
                                                {selected ? (
                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                        <Check className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}

                                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); openDialog(destination); }}
                                                        className={`p-1 rounded hover:bg-black/10 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(e, destination)}
                                                        className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))
                            )}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>

            {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}

            {/* Dialog for Add/Edit */}
            <Transition.Root show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[60]" onClose={closeDialog}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                                        <Dialog.Title className="text-lg font-bold">
                                            {editingDestination ? "Editar Destino" : "Nuevo Destino"}
                                        </Dialog.Title>
                                        <button onClick={closeDialog} className="text-white/80 hover:text-white transition-colors">
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <div className="bg-white px-6 py-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">
                                                    Nombre del Destino
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value.toUpperCase())}
                                                    placeholder="Ej: PLANTA, PUERTO, etc."
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 uppercase font-bold"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={isSaving || !newName.trim()}
                                            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 transition-all"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {isSaving ? "Guardando..." : "GUARDAR"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closeDialog}
                                            className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
                                        >
                                            CANCELAR
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}
