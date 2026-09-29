import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import { Check, ChevronsUpDown, Plus, Pencil, Save, Trash2, X, Building2 } from "lucide-react";
import axios from "axios";

interface ServiceProvider {
    id: number;
    name: string;
}

interface ServiceProviderDropdownProps {
    value?: string;
    initialProviders?: ServiceProvider[];
    onChange: (name: string) => void;
    error?: string;
}

export default function ServiceProviderDropdown({ value = "", initialProviders = [], onChange, error }: ServiceProviderDropdownProps) {
    const [providers, setProviders] = useState<ServiceProvider[]>(initialProviders);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchProviders = async () => {
        try {
            const response = await axios.get(route("service-providers.index"));
            if (Array.isArray(response.data)) setProviders(response.data);
        } catch (fetchError) {
            console.error("Error fetching service providers:", fetchError);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    useEffect(() => {
        if (initialProviders.length > 0) setProviders(initialProviders);
    }, [initialProviders]);

    const selectedProvider = providers.find((provider) => provider.name === value);

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingProvider(null);
        setNewName("");
    };

    const openDialog = (provider: ServiceProvider | null = null) => {
        setEditingProvider(provider);
        setNewName(provider?.name || "");
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        try {
            const response = editingProvider
                ? await axios.put(route("service-providers.update", editingProvider.id), { name: newName.trim() })
                : await axios.post(route("service-providers.store"), { name: newName.trim() });
            const savedProvider = response.data as ServiceProvider;
            await fetchProviders();
            onChange(savedProvider.name);
            closeDialog();
        } catch (saveError: any) {
            alert(saveError.response?.data?.errors?.name?.[0] || saveError.response?.data?.message || "Error al guardar empresa");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (event: React.MouseEvent, provider: ServiceProvider) => {
        event.stopPropagation();
        if (!confirm(`¿Estás seguro de eliminar "${provider.name}"?`)) return;
        try {
            await axios.delete(route("service-providers.destroy", provider.id));
            await fetchProviders();
            if (value === provider.name) onChange("");
        } catch (deleteError) {
            console.error("Error deleting service provider:", deleteError);
            alert("Error al eliminar empresa");
        }
    };

    return (
        <div className="relative">
            <Listbox value={selectedProvider?.id || ""} onChange={(id) => onChange(providers.find((provider) => provider.id === Number(id))?.name || "")}>
                <div className="relative mt-1">
                    <Listbox.Button className={`relative w-full cursor-default rounded-xl border bg-white py-2.5 pl-11 pr-10 text-left shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${error ? "border-red-500" : "border-slate-300"}`}>
                        <Building2 className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                        <span className={`block truncate font-semibold ${selectedProvider ? "text-slate-800" : "text-slate-400"}`}>
                            {selectedProvider?.name || value || "Seleccione una empresa..."}
                        </span>
                        <ChevronsUpDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                            <li className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50">
                                <button type="button" onClick={() => openDialog()} className="flex w-full items-center px-4 py-2.5 font-bold text-sky-700 hover:bg-sky-50">
                                    <Plus className="mr-2 h-4 w-4" /> Agregar Nueva Empresa
                                </button>
                            </li>
                            {providers.map((provider) => (
                                <Listbox.Option key={provider.id} value={provider.id} className={({ active }) => `relative cursor-default select-none py-2.5 pl-10 pr-20 ${active ? "bg-sky-600 text-white" : "text-slate-900"}`}>
                                    {({ selected, active }) => (
                                        <>
                                            <span className={`block truncate ${selected ? "font-bold" : "font-normal"}`}>{provider.name}</span>
                                            {selected && <Check className={`absolute left-3 top-2.5 h-5 w-5 ${active ? "text-white" : "text-sky-600"}`} />}
                                            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                                <button type="button" onClick={(event) => { event.stopPropagation(); openDialog(provider); }} className={`rounded p-1 hover:bg-black/10 ${active ? "text-white" : "text-slate-400"}`}><Pencil className="h-3.5 w-3.5" /></button>
                                                <button type="button" onClick={(event) => handleDelete(event, provider)} className={`rounded p-1 hover:bg-red-500 hover:text-white ${active ? "text-white" : "text-slate-400"}`}><Trash2 className="h-3.5 w-3.5" /></button>
                                            </div>
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
            <Transition.Root show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[60]" onClose={closeDialog}>
                    <div className="fixed inset-0 bg-slate-900/60" />
                    <div className="fixed inset-0 z-10 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4"><Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-sky-700 px-6 py-4 text-white"><Dialog.Title className="text-lg font-bold">{editingProvider ? "Editar Empresa" : "Nueva Empresa"}</Dialog.Title><button type="button" onClick={closeDialog}><X className="h-6 w-6" /></button></div>
                        <div className="px-6 py-6"><label className="mb-1 block text-sm font-bold uppercase text-slate-700">Nombre de la empresa</label><input type="text" value={newName} onChange={(event) => setNewName(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && handleSave()} autoFocus className="w-full rounded-lg border-slate-300 py-3 font-bold uppercase shadow-sm focus:border-sky-500 focus:ring-sky-500" /></div>
                        <div className="flex flex-row-reverse gap-3 bg-slate-50 px-6 py-4"><button type="button" onClick={handleSave} disabled={isSaving || !newName.trim()} className="inline-flex items-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:opacity-50"><Save className="mr-2 h-4 w-4" />{isSaving ? "Guardando..." : "GUARDAR"}</button><button type="button" onClick={closeDialog} className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-300">CANCELAR</button></div>
                    </Dialog.Panel></div></div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}
