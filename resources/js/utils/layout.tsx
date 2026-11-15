import type { ReactNode, ComponentType } from "react";
import FrontendLayout from "@/Layouts/FrontendLayout";

type PageWithLayout<P> = ComponentType<P> & { layout?: (page: ReactNode) => ReactNode };

export function withFrontendLayout<P extends object>(Page: ComponentType<P>): ComponentType<P> {
    (Page as PageWithLayout<P>).layout = (page: ReactNode) => <FrontendLayout>{page}</FrontendLayout>;
    return Page;
}
