import { useEffect } from "react";
import { router } from "@inertiajs/react";

export function useSettingsListener() {
    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.channel("settings");

        channel.listen(".SettingsUpdated", () => {
            router.reload({ only: ["settings"] });
        });

        return () => {
            channel.stopListening(".SettingsUpdated");
            window.Echo.leave("settings");
        };
    }, []);
}
