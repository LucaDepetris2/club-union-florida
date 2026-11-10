/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
    /** ID de medición de Google Analytics 4 (G-XXXXXXX). Sin valor no se carga GA. */
    readonly PUBLIC_GA_ID?: string;
    readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
