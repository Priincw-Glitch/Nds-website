import { Code2, AppWindow, Network, Users, Server, Camera, Monitor, ShieldCheck, Headphones, HeartHandshake, Building2, Globe, Lock, Cpu, Wifi, FileCode2, Smartphone, Database } from "lucide-react";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Code2,
    AppWindow,
    Network,
    Users,
    Server,
    Camera,
    Monitor,
    ShieldCheck,
    Headphones,
    HeartHandshake,
    Building2,
    Globe,
    Lock,
    Cpu,
    Wifi,
    FileCode2,
    Smartphone,
    Database,
};

export function ServiceIcon({ name, className = "h-6 w-6" }: { name?: string | null; className?: string }) {
    const Icon = icons[name || ""] || Code2;
    return <Icon className={className} />;
}
