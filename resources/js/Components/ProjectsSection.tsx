import { storageUrl } from "@/utils/assets";
import type { ProjectItem } from "@/types";

interface ProjectsSectionProps {
    projects: ProjectItem[];
}

/**
 * Portofolio proyek di beranda. Sengaja tanpa tautan per kartu: belum ada
 * halaman detail publik, jadi kartu menampilkan hasil kerja, bukan tautan
 * buntu. Judul & kategori membaca hasil kerja; kontak ada di CTA penutup.
 */
export default function ProjectsSection({ projects }: ProjectsSectionProps) {
    if (projects.length === 0) return null;

    return (
        <section className="bg-white py-20 lg:py-28">
            <div className="container-nds">
                <div className="max-w-2xl">
                    <p className="gsap-reveal text-[11px] font-semibold uppercase tracking-[0.2em] text-tech-blue">
                        Portofolio
                    </p>
                    <h2 className="gsap-reveal mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                        Proyek yang Telah Kami Kerjakan
                    </h2>
                    <p className="gsap-reveal mt-4 text-base leading-relaxed text-body-text">
                        Sebagian pekerjaan tim NDS untuk klien lintas industri: dari jaringan
                        perusahaan, sistem aplikasi bisnis, hingga pemasangan sistem keamanan.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    {projects.map((project) => (
                        <figure key={project.id} className="gsap-reveal group">
                            <div className="overflow-hidden rounded-xl border border-border-soft bg-light-gray">
                                {project.thumbnail ? (
                                    <img
                                        src={storageUrl(project.thumbnail)}
                                        alt={`Proyek ${project.title}`}
                                        loading="lazy"
                                        className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                    />
                                ) : (
                                    <div className="flex aspect-[16/10] w-full items-center justify-center bg-navy text-white/60">
                                        <span className="text-sm font-semibold">{project.category || "Proyek NDS"}</span>
                                    </div>
                                )}
                            </div>
                            <figcaption className="pt-4">
                                {project.category && (
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tech-blue">
                                        {project.category}
                                    </p>
                                )}
                                <h3 className="mt-1 text-base font-bold text-navy">{project.title}</h3>
                                {project.client && (
                                    <p className="mt-0.5 text-xs text-body-text">Klien: {project.client}</p>
                                )}
                                {project.description && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-body-text">
                                        {project.description}
                                    </p>
                                )}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
