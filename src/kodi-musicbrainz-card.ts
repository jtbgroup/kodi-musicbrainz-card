/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { HomeAssistant, LovelaceCardEditor, getLovelace, hasConfigOrEntityChanged } from "custom-card-helpers";
import { localize } from "./localize/localize";
import Sortable from "sortablejs";
// import { loadSortable } from "./sortable.ondemand";
import type { SortableEvent } from "sortablejs";

import "./editor";
import type { KodiMusicBrainzCardConfig } from "./types";
import { CARD_VERSION, DEFAULT_ENTITY_NAME, RESULT_ARTISTS, RESULT_RELEASEGROUPS } from "./const";

/* eslint no-console: 0 */
console.info(
    `%c  KODI-MUSICBRAINZ-CARD\n%c  ${localize("common.version")} ${CARD_VERSION}    `,
    "color: orange; font-weight: bold; background: black",
    "color: white; font-weight: bold; background: dimgray",
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "kodi-musicbrainz-card",
    name: "Kodi MusicBrainz Card",
    description: "This custom card allows you search albums on MusicBrainz",
});

@customElement("kodi-musicbrainz-card")
export class KodiMusicBrainzCard extends LitElement {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        return document.createElement("kodi-musicbrainz-card-editor");
    }

    public static getStubConfig(): Record<string, unknown> {
        return {
            entity: DEFAULT_ENTITY_NAME,
        };
    }

    private ICON_CURRENT_PLAYING = "mdi:arrow-left-bold";
    private _entityState;
    private _json_meta;
    private _json_data;
    private _service_domain;
    private _currently_playing;
    private _currently_playing_file;
    private sortable;
    private _searchInput;
    @state()
    private _resultArtists;
    @state()
    private _resultReleaseGroups;
    @state()
    private _resultObject = 0;

    // TODO Add any properities that should cause your element to re-render here
    // https://lit.dev/docs/components/properties/
    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private config!: KodiMusicBrainzCardConfig;

    public setConfig(config: KodiMusicBrainzCardConfig): void {
        // TODO Check for required fields and that they are of the proper format
        if (!config) {
            throw new Error(localize("common.invalid_configuration"));
        }

        if (config.test_gui) {
            getLovelace().setEditMode(true);
        }

        this.config = config;
    }

    public getCardSize(): number {
        return 20;
    }

    // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
    protected shouldUpdate(changedProps: PropertyValues): boolean {
        if (!this.config) {
            return false;
        }

        return hasConfigOrEntityChanged(this, changedProps, false);
    }

    // https://lit.dev/docs/components/rendering/
    protected render(): TemplateResult | void {
        // console.log("in render");
        let errorMessage;
        const entity = this.config.entity;
        if (!entity) {
            errorMessage = "No Entity defined";
            console.error(errorMessage);
        } else {
            this._entityState = this.hass.states[entity];
            if (!this._entityState) {
                errorMessage = "No State for the sensor";
                console.error(errorMessage);
            } else {
                if (this._entityState.state == "off") {
                    errorMessage = "Kodi is off";
                    console.error(errorMessage);
                } else {
                    const meta = this._entityState.attributes.meta;
                    if (!meta) {
                        console.error("no metadata for the sensor");
                        return;
                    }
                    this._json_meta = typeof meta == "object" ? meta : JSON.parse(meta);
                    if (this._json_meta.length == 0) {
                        console.error("empty metadata attribute");
                        return;
                    }
                    this._service_domain = this._json_meta[0]["service_domain"];
                    this._currently_playing = this._json_meta[0]["currently_playing"];
                    this._currently_playing_file = this._json_meta[0]["currently_playing_file"];
                    const data = this._entityState.attributes.data;
                    this._json_data = typeof data == "object" ? data : JSON.parse(data);
                }
            }
        }

        const card = html`
            <ha-card
                .header=${this.config.title ? this.config.title : ""}
                tabindex="0"
                .label=${`Kodi MusicBrainz ${this.config.entity || "No Entity Defined"}`}>
                <div class="card-container">${errorMessage ? errorMessage : this._buildCardContainer()}</div>
            </ha-card>
        `;
        return card;
    }

    private _buildCardContainer() {
        this._searchInput = document.createElement("ha-textfield");
        this._searchInput.setAttribute("outlined", "");
        this._searchInput.setAttribute("label", "Search criteria");
        this._searchInput.setAttribute("class", "form-button");
        this._searchInput.addEventListener("keydown", event => {
            if (event.code === "Enter") {
                this._searchArtists();
            }
        });

        return html`
            ${this.config.show_version ? html`<div>${CARD_VERSION}</div>` : ""}
            <div>MusisBrainz Card search</div>
            <div>
                ${this._searchInput}
                <mwc-button class="form-button" label="Search" raised @click="${this._searchArtists}" }></mwc-button>
            </div>
            <div id="result-musicbrainz">
                <div>RESULT</div>
                ${this._buildResult()}
            </div>
        `;
    }

    private _buildResult() {
        // console.log(this._resultObject);
        console.log(this._resultReleaseGroups);

        if (this._resultObject == RESULT_ARTISTS && this._resultArtists && this._resultArtists.length > 0) {
            return this._createArtistsResult();
        } else if (
            this._resultObject == RESULT_RELEASEGROUPS &&
            this._resultReleaseGroups &&
            this._resultReleaseGroups.length > 0
        ) {
            return this._createReleaseGroupsResult();
        }
        return html`<div><i>No Result</i></div>`;
    }

    private _createSearchReleaseGroupsButton(artistId) {
        const playDiv = document.createElement("ha-icon");
        playDiv.setAttribute("icon", "mdi:disc");
        // playDiv.setAttribute("class", clickActionClass);

        playDiv.addEventListener("click", () => this.searchReleaseGroups(artistId));

        return html`${playDiv}`;
    }

    private _createReleaseGroupsResult() {
        console.log("RG");
        // console.log(this._resultReleaseGroups);

        const a = this._resultReleaseGroups.sort(function (a, b) {
            const type = a["primary-type"].localeCompare(b["primary-type"]);
            if (type != 0) return type;
            if (!a["first-release-date"] || !b["first-release-date"]) return type;
            return b["first-release-date"].localeCompare(a["first-release-date"]);
        });

        const primaryTypes = [...new Set(a.map(data => data["primary-type"]))];
        console.log(primaryTypes);

        console.log(a);
        return html`<div class="mb_results">
            ${primaryTypes.map(
                item => html` <div class="mb_rg_container">
                    <div class="mb_rg_type">type: ${item}</div>
                    <div class="mb_rg_type_container">
                        ${this._filterTypes(a, item).map(
                            res => html` <div class="mb_rg_grid_detail">

                            <div class="mb_rg_detail_title">${res["title"]}</div>
                            <ha-icon icon="mdi:calendar" class="mb_rg_detail_release_icon"></ha-icon>
                            <div class="mb_rg_detail_release">
                                    ${res["first-release-date"] ? html` ${res["first-release-date"]}` : ``}
                                </div>
                            <div class="mb_rg_detail_types">
                                    ${res["secondary-types"]}
                                </div>
                            <img id="cover_${res["id"]}" src="" class="mb_rg_detail_cover">${this.getCover(res)}
                            </div></diV>`,
                        )}
                    </div>
                </div>`,
            )}
        </div>`;
    }

    private getCover(item) {
        if (item["releases"][0]) {
            const releaseId = item["releases"][0]["id"];

            let url = "https://coverartarchive.org/release/" + releaseId;
            url = encodeURI(url);
            console.log(url);

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const urlImg = data.images[0].thumbnails.small;
                    console.log(urlImg);
                    const tagId = "#cover_" + item.id;

                    const playlist = this.shadowRoot?.querySelector(tagId) as HTMLElement;
                    playlist.setAttribute("src", urlImg);
                    // document.getElementById(tagId)?.setAttribute("src", urlImg);
                });
        }
    }

    private _filterTypes(json, value) {
        const result = json.filter(item => {
            return item["primary-type"] == value;
        });

        return result;
    }

    private _createArtistsResult() {
        // console.log("AR");
        // console.log(this._resultArtists);

        return html`<div class="mb_results">
            ${this._resultArtists.map(
                item => html`<div class="mb_artist_grid">
                    <div class="mb_artist_btn">${this._createSearchReleaseGroupsButton(item["id"])}</div>
                    <div class="mb_artist_name">
                        ${item["name"]} ${item["country"] ? html` (${item["country"]})` : ``}
                    </div>

                    <div class="mb_artist_activity">
                        ${item["life-span"]["begin"] ? html`${item["life-span"]["begin"]}` : ``}
                        ${item["life-span"]["end"] ? html` - ${item["life-span"]["end"]}` : ``}
                    </div>

                    <div class="mb_artist_info">${item["disambiguation"]}</div>
                </div>`,
            )}
        </div>`;
    }
    private _searchArtists() {
        const searchText = this._searchInput.value;
        // this._searchInput.value = "";

        let url = "http://musicbrainz.org/ws/2/artist/?fmt=json&query=artist:" + searchText;
        url = encodeURI(url);
        console.log(url);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                this._resultObject = RESULT_ARTISTS;
                this._resultArtists = data.artists;
            });
    }

    private searchReleaseGroups(artistId) {
        this._resultReleaseGroups = [];
        const urlSingles =
            "http://musicbrainz.org/ws/2/release-group/?fmt=json&query=primarytype:single AND arid:" + artistId;
        const urlAlbums =
            "http://musicbrainz.org/ws/2/release-group/?fmt=json&query=primarytype:album AND arid:" + artistId;
        console.log(encodeURI(urlAlbums));

        Promise.all([fetch(encodeURI(urlSingles)), fetch(encodeURI(urlAlbums))])
            .then(function (responses) {
                // Get a JSON object from each of the responses
                return Promise.all(
                    responses.map(function (response) {
                        return response.json();
                    }),
                );
            })
            .then(data => {
                // Log the data to the console
                // You would do something with both sets of data here
                let tmp = [];
                data.forEach(element => {
                    tmp = tmp.concat(element["release-groups"]);
                });

                this._resultObject = RESULT_RELEASEGROUPS;
                this._resultReleaseGroups = tmp;
            })
            .catch(function (error) {
                // if there's an error, log it
                console.log(error);
            });
    }

    static get styles(): CSSResultGroup {
        return css`
            :root {
                --outline-color: "-----";
                --items-container-height: 300px;
            }

            :host {
                --mdc-select-fill-color: rgba(0, 0, 0, 0);
            }

            .mb_results {
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: auto;
                row-gap: 20px;
            }

            .mb_artist_grid {
                display: grid;
                grid-template-columns: auto 1fr;
                grid-template-rows: auto;
            }

            .mb_artist_btn {
                grid-column: 1;
                grid-row: 1 / 3;
            }

            .mb_artist_name {
                grid-column: 2;
                grid-row: 1;
                font-weight: bold;
            }
            .mb_artist_activity {
                grid-column: 2 / 3;
                grid-row: 2;
                font-style: italic;
            }
            .mb_artist_info {
                grid-column: 2 / 3;
                grid-row: 3;
            }

            .mb_rg_type {
                font-weight: bold;
                text-align: right;
            }

            .mb_rg_container {
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: auto;
                row-gap: 10px;
            }

            .mb_rg_type_container {
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: auto;
                row-gap: 5px;
            }

            .mb_rg_grid_detail {
                display: grid;
                grid-template-columns: auto auto 1fr auto;
                grid-template-rows: auto;
            }
            .mb_rg_detail_title {
                grid-column: 1 / 3;
                grid-row: 1;
                font-weight: bold;
            }
            .mb_rg_detail_release_icon {
                grid-column: 1;
                grid-row: 2;
            }
            .mb_rg_detail_release {
                grid-column: 2;
                grid-row: 2;
            }
            .mb_rg_detail_types {
                grid-column: 3;
                grid-row: 2;
                text-align: right;
                font-style: italic;
            }
            .mb_rg_detail_cover {
                grid-column: 4;
                grid-row: 1 / 3;
                border: 1px solid red;
                width: 50px;
                height: 50px;
            }
        `;
    }
}

