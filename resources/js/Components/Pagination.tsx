import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Pagination({ links }: { links: any[] }) {
    if (links.length <= 3) return null; // Don't show if only previous/next exist and no data, or just 1 page

    return (
        <div className="flex flex-wrap justify-center gap-1 mt-6">
            {links.map((link, key) => {
                // Determine icon for Previous/Next
                let label = link.label;
                let icon = null;

                if (link.label.includes('&laquo;') || link.label.includes('pagination.previous') || link.label.toLowerCase().includes('previous')) {
                    icon = <ChevronLeft className="w-4 h-4" />;
                    label = '';
                } else if (link.label.includes('&raquo;') || link.label.includes('pagination.next') || link.label.toLowerCase().includes('next')) {
                    icon = <ChevronRight className="w-4 h-4" />;
                    label = '';
                }

                return (
                    link.url === null ? (
                        <div
                            key={key}
                            className={cn(
                                "flex items-center justify-center px-4 py-2 text-sm text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed opacity-50",
                                // link.active ? "bg-indigo-50 border-indigo-500 text-indigo-600" : "" // Active is usually clickable, inactive null url is not
                            )}
                        >
                            {icon || <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                        </div>
                    ) : (
                        <Link
                            key={key}
                            href={link.url}
                            className={cn(
                                "flex items-center justify-center px-4 py-2 text-sm border rounded-lg transition-colors duration-200",
                                link.active
                                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            )}
                        >
                            {icon || <span dangerouslySetInnerHTML={{ __html: label }} />}
                        </Link>
                    )
                );
            })}
        </div>
    );
}
