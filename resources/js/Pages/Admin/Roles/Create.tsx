import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";

export default function Create({
    auth,
    permissions,
}: {
    auth: any;
    permissions: any[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        permissions: [] as string[],
    });

    const handlePermissionChange = (
        permissionName: string,
        checked: boolean,
    ) => {
        if (checked) {
            setData("permissions", [...data.permissions, permissionName]);
        } else {
            setData(
                "permissions",
                data.permissions.filter((p) => p !== permissionName),
            );
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.roles.store"));
    };

    return (
        <DashboardLayout user={auth.user} header="Crear Nuevo Rol">
            <Head title="Crear Rol" />

            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nombre del Rol
                        </label>
                        <TextInput
                            id="name"
                            type="text"
                            value={data.name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                            Permisos
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {permissions.map((permission) => (
                                <div
                                    key={permission.id}
                                    className="flex items-start"
                                >
                                    <div className="flex h-5 items-center">
                                        <input
                                            id={`permission-${permission.id}`}
                                            name="permissions[]"
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            onChange={(e) =>
                                                handlePermissionChange(
                                                    permission.name,
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label
                                            htmlFor={`permission-${permission.id}`}
                                            className="font-medium text-gray-700"
                                        >
                                            {permission.name}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link
                            href={route("admin.roles.index")}
                            className="text-sm text-gray-600 hover:text-gray-900 mr-4"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            Crear Rol
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
