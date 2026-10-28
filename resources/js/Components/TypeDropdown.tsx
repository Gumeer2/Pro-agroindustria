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
    FileText
} from 'lucide-react';
import axios from 'axios';

export interface ExitOperatorTypeItem {
    id: number;
    name: string;
}

interface TypeDropdownProps {
    value?: string;
    initialTypes?: ExitOperatorTypeItem[];
    onChange: (name: string) => void;
    label?: string;
    error?: string;
}

export default function TypeDropdown({
    value = "",
    initialTypes = [],
    onChange,
    label = "Tipo:",
    error
}: TypeDropdownProps) {
    const [types, setTypes] = useState<ExitOperatorTypeItem[]>(initialTypes);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<ExitOperatorTypeItem | null>(null);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('exit-operator-types.index'));
            if (Array.isArray(response.data)) {
                setTypes(response.data);
            }
        } catch (err) {
            console.error("Error fetching types:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    useEffect(() => {
        if (initialTypes && initialTypes.length > 0) {
            setTypes(initialTypes);
        }
    }, [initialTypes]);

    const handleSave = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        try {
            let savedName = "";
            if (editingType) {
                const resp = await axios.put(route('exit-operator-types.update', editingType.id), { name: newName.trim() });
                savedName = resp.data?.name || newName.trim().toUpperCase();
            } else {
                const resp = await axios.post(route('exit-operator-types.store'), { name: newName.trim() });
                savedName = resp.data?.name || newName.trim().toUpperCase();
            }
            await fetchTypes();
            if (savedName) {
                onChange(savedName);
            }
            closeDialog();
        } catch (err: any) {
            const errorMsg = err.response?.data?.errors?.name?.[0] || err.response?.data?.message || "Error al guardar el tipo";
            alert(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, typeItem: ExitOperatorTypeItem) => {
        e.stopPropagation();
        if (!confirm(`¿Estás seguro de eliminar el tipo "${typeItem.name}"?`)) return;
        try {
            await axios.delete(route('exit-operator-types.destroy', typeItem.id));
            if (value === typeItem.name) {
                onChange("");
            }
            await fetchTypes();
        } catch (err) {
            console.error("Error deleting type:", err);
            alert("Error al eliminar el tipo");
        }
    };

    const openDialog = (typeItem: ExitOperatorTypeItem | null = null) => {
        setEditingType(typeItem);
        setNewName(typeItem ? typeItem.name : "");
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingType(null);
        setNewName("");
    };

    const selectedType = types.find(t => t.name === value || (value && t.name.toLowerCase() === value.toLowerCase()));

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <Listbox value={value} onChange={(val) => onChange(val)}>
                <div className="relative">
                    <Listbox.Button className={`relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold sm:text-sm transition-all ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                        <span className={`block truncate ${selectedType || value ? 'text-indigo-900 font-bold' : 'text-gray-400 font-normal'}`}>
                            {selectedType?.name || value || "Seleccione tipo..."}
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
                                    Agregar Nuevo Tipo
                                </button>
                            </div>

                            {value && (
                                <Listbox.Option
                                    key="clear-option"
                                    value=""
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 text-xs italic ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400'}`
                                    }
                                >
                                    -- Limpiar selección --
                                </Listbox.Option>
                            )}

                            {loading && types.length === 0 ? (
                                <div className="px-4 py-2 text-gray-400 italic text-xs">Cargando tipos...</div>
                            ) : types.length === 0 ? (
                                <div className="px-4 py-2 text-gray-400 italic text-xs">No hay tipos registrados. Haga clic en Agregar Nuevo Tipo.</div>
                            ) : (
                                types.map((item) => (
                                    <Listbox.Option
                                        key={item.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2.5 pl-10 pr-20 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`
                                        }
                                        value={item.name}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                                    {item.name}
                                                </span>
                                                {selected ? (
                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                        <Check className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}

                                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); openDialog(item); }}
                                                        className={`p-1 rounded hover:bg-black/10 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
                                                        title="Editar tipo"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(e, item)}
                                                        className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
                                                        title="Eliminar tipo"
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

            {/* Modal Dialog for Add/Edit */}
            <Transition.Root show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[70]" onClose={closeDialog}>
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
                                            {editingType ? "Editar Tipo" : "Nuevo Tipo"}
                                        </Dialog.Title>
                                        <button
                                            type="button"
                                            onClick={closeDialog}
                                            className="text-white hover:text-gray-200 rounded-lg p-1 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Nombre del Tipo <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSave();
                                                }
                                            }}
                                            placeholder="Ej. SACO BLANCO, LAMINADO, BIG BAG..."
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 font-bold uppercase text-gray-800"
                                            autoFocus
                                        />

                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={closeDialog}
                                                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSave}
                                                disabled={isSaving || !newName.trim()}
                                                className={`inline-flex items-center px-5 py-2 rounded-xl text-white font-bold shadow-md transition-all ${
                                                    isSaving || !newName.trim()
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                                }`}
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {isSaving ? "Guardando..." : "Guardar"}
                                            </button>
                                        </div>
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

