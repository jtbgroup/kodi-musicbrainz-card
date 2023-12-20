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
    filter_secondType_live: boolean;
    filter_secondType_soundtrack: boolean;
    filter_secondType_compilation: boolean;
    filter_secondType_remix: boolean;
}

