export const CARD_VERSION = "1.2.4";

export const DEFAULT_ENTITY_NAME = "sensor.kodi_media_sensor_playlist";
export const RESULT_ARTISTS = 1;
export const RESULT_RELEASEGROUPS = 2;

export const PRIMARYY_TYPES = {
    Album: { id: "filter_primaryType_album", editor_label: "Include primary type Album", mb_query:"album"},
    Single: { id: "filter_primaryType_single", editor_label: "Include primary type Single", mb_query:"single" },
    Broadcast: { id: "filter_primaryType_broadcast", editor_label: "Include primary type Broadcast" , mb_query:"broadcast"},
    EP: { id: "filter_primaryType_ep", editor_label: "Include primary type EP", mb_query:"ep" },
    Other: { id: "filter_primaryType_other", editor_label: "Include primary type Other" , mb_query:"dj-mix"},
};
export const SECONDARY_TYPES = {
    Demo: { id: "filter_secondaryType_demo", editor_label: "Include secondary type Demo", mb_query:"demo" },
    Live: { id: "filter_secondaryType_live", editor_label: "Include secondary type Live", mb_query:"live" },
    Soundtrack: { id: "filter_secondaryType_soundtrack", editor_label: "Include secondary type Soundtrack", mb_query:"soundtrack" },
    Compilation: { id: "filter_secondaryType_compilation", editor_label: "Include secondary type Compilation", mb_query:"compilation" },
    Remix: { id: "filter_secondaryType_remix", editor_label: "Include secondary type Remix" , mb_query:"remix"},
    DJ_Mix: { id: "filter_secondaryType_djmix", editor_label: "Include secondary type DJ-Mix" , mb_query:"dj-mix"},
};
