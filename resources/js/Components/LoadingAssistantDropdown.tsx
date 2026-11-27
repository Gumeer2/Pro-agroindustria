import { Fragment, useEffect, useState } from "react";
import { Check, ChevronsUpDown, Plus, Trash2, UserRound } from "lucide-react";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import axios from "axios";
import Swal from "sweetalert2";

interface Assistant { id: number; name: string; }

interface Props {
    value?: string;
    initialAssistants?: Assistant[];
    onChange: (name: string) => void;
}

export default function LoadingAssistantDropdown({ value = "", initialAssistants = [], onChange }: Props) {
    const [assistants, setAssistants] = useState<Assistant[]>(initialAssistants);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchAssistants = async () => {
        try {
            const response = await axios.get(route("loading-assistants.index"));
            if (Array.isArray(response.data)) setAssistants(response.data);
        } catch (error) {
            console.error("Error fetching loading assistants:", error);
        }
    };

    useEffect(() => { fetchAssistants(); }, []);
    useEffect(() => { if (initialAssistants.length > 0) setAssistants(initialAssistants); }, [initialAssistants]);

    const selected = assistants.find((assistant) => assistant.name === value);
    const closeDialog = () => { setIsDialogOpen(false); setNewName(""); };

    const handleSave = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        try {
            const response = await axios.post(route("loading-assistants.store"), { name: newName.trim() });
            await fetchAssistants();
            onChange(response.data.name);
            closeDialog();
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "Error al guardar auxiliar de carga",
            });
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (assistant: Assistant, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const result = await Swal.fire({
            title: "¿Eliminar Auxiliar de Carga?",
            html: `¿Estás seguro de que deseas eliminar a <b>${assistant.name}</b> de la lista?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(route("loading-assistants.destroy", assistant.id));
            if (value === assistant.name) {
                onChange("");
            }
            await fetchAssistants();
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Auxiliar eliminado",
                showConfirmButton: false,
                timer: 2000,
            });
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "No se pudo eliminar el auxiliar de carga",
            });
        }
    };

    return (
        <div className="relative mt-2">
            <Listbox value={selected?.id || ""} onChange={(id) => onChange(assistants.find((item) => item.id === Number(id))?.name || "")}>
                <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-left font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <UserRound className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        <span className={`block truncate pl-8 ${selected ? "text-gray-800" : "text-gray-400"}`}>{selected?.name || value || "Seleccione un auxiliar..."}</span>
                        <ChevronsUpDown className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                            <li className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                                <button type="button" onClick={() => setIsDialogOpen(true)} className="flex w-full items-center px-4 py-2.5 font-bold text-indigo-600 hover:bg-indigo-50 cursor-pointer">
                                    <Plus className="mr-2 h-4 w-4" /> Agregar un Nuevo Auxiliar de Carga
                                </button>
                            </li>
                            {assistants.map((assistant) => (
                                <Listbox.Option key={assistant.id} value={assistant.id} className={({ active }) => `relative cursor-default select-none py-2.5 pl-10 pr-3 flex items-center justify-between ${active ? "bg-indigo-600 text-white" : "text-gray-900"}`}>
                                    {({ selected: isSelected, active }) => (
                                        <>
                                            <div className="flex items-center truncate">
                                                {isSelected && <Check className={`absolute left-3 top-2.5 h-5 w-5 ${active ? "text-white" : "text-indigo-600"}`} />}
                                                <span className={isSelected ? "font-bold truncate" : "font-normal truncate"}>{assistant.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(assistant, e)}
                                                className={`p-1 rounded transition cursor-pointer shrink-0 ${active ? "text-white/80 hover:text-white hover:bg-indigo-700" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
                                                title={`Eliminar ${assistant.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            <Transition.Root show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[60]" onClose={closeDialog}>
                    <div className="fixed inset-0 bg-gray-500/75" />
                    <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <div className="bg-indigo-600 px-6 py-4 text-white"><Dialog.Title className="text-lg font-bold">Nuevo Auxiliar de Carga</Dialog.Title></div>
                            <div className="px-6 py-6">
                                <label className="mb-1 block text-sm font-bold uppercase text-gray-700">Nombre del Auxiliar de Carga</label>
                                <input autoFocus value={newName} onChange={(event) => setNewName(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && handleSave()} className="w-full rounded-lg border-gray-300 py-3 font-bold uppercase shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="NOMBRE COMPLETO" />
                            </div>
                            <div className="flex flex-row-reverse gap-3 bg-gray-50 px-6 py-4">
                                <button type="button" onClick={handleSave} disabled={isSaving || !newName.trim()} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer">{isSaving ? "Guardando..." : "GUARDAR"}</button>
                                <button type="button" onClick={closeDialog} className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-gray-700 ring-1 ring-inset ring-gray-300 cursor-pointer">CANCELAR</button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}
