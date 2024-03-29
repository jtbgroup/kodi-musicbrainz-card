import { LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from "custom-card-helpers";

declare global {
    interface HTMLElementTagNameMap {
        "kodi-musicbrainz-card-editor": LovelaceCardEditor;
        "hui-error-card": LovelaceCard;
    }
}

// TODO Add your configuration elements here for type-checking
export interface KodiMusicBrainzCardConfig extends LovelaceCardConfig {
    entity?: string;
    title?: string;
    show_version: boolean;
    show_filter_primaryType: boolean;
    show_filter_secondaryType: boolean;
    filter_primaryType_single: boolean;
    filter_primaryType_album: boolean;
    filter_primaryType_ep: boolean;
    filter_primaryType_broadcast: boolean;
    filter_primaryType_other: boolean;
    filter_secondaryType_demo: boolean;
    filter_secondaryType_live: boolean;
    filter_secondaryType_soundtrack: boolean;
    filter_secondaryType_compilation: boolean;
    filter_secondaryType_remix: boolean;
    filter_secondaryType_djmix: boolean;
    limit: number;
}


