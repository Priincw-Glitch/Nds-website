import React from "react";
import { cn } from "@/lib/utils";

export interface BlogCardGridProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    getItemKey?: (item: T, index: number) => string | number;
    className?: string;
    columns?: 2 | 3 | 4;
    gap?: number;
}

/**
 * Static grid layout for blog articles on homepage.
 * Displays cards in a responsive grid without any carousel/slider behavior.
 */
export function BlogCardGrid<T>({
    items,
    renderItem,
    getItemKey,
    className,
    columns = 3,
    gap = 24,
}: BlogCardGridProps<T>) {
    const columnClasses = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    };

    return (
        <div
            className={cn(
                "blog-card-grid grid w-full",
                columnClasses[columns],
                className
            )}
            style={{ gap: gap }}
            role="list"
            aria-label="Kumpulan artikel statis"
        >
            {items.map((item, index) => {
                const key = getItemKey ? getItemKey(item, index) : `item-${index}`;
                return (
                    <div key={key} className="flex-shrink-0 max-w-full" role="listitem">
                        {renderItem(item, index)}
                    </div>
                );
            })}
        </div>
    );
}