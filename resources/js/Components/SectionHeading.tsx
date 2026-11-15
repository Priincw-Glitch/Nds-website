interface SectionHeadingProps {
    title: string;
    description?: string;
    align?: "left" | "center";
    className?: string;
}

export function SectionHeading({ title, description, align = "left", className = "" }: SectionHeadingProps) {
    return (
        <div className={`gsap-reveal ${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
            <h2 className="heading-2 text-balance">{title}</h2>
            {description && <p className="mt-4 text-base leading-relaxed text-body-text sm:text-lg">{description}</p>}
        </div>
    );
}