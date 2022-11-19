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

    private _entityState;
    private _json_meta;
    private _entity;
    private _card;
    private _searchInput;
    private firstRun = true;

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

        if (this.firstRun) {
            this._card = html`
                <ha-card
                    .header=${this.config.title ? this.config.title : ""}
                    tabindex="0"
                    .label=${`Kodi MusicBrainz ${this.config.entity || "No Entity Defined"}`}>
                    <div class="card-container">${errorMessage ? errorMessage : this._buildCardContainer()}</div>
                </ha-card>
            `;
        }

        this.fillEntityArtist();

        return this._card;
    }

    private fillEntityArtist() {
        const entity = this.config.entity;
        if (entity) {
            const entityState = this.hass.states[entity];
            console.log(entityState);
            if (entityState.attributes.media_artist) {
            }

            const artist = entityState.attributes.media_artist;
            const artistEl = document.getElementById("entity_artist");
            if (artistEl) {
                artistEl.setAttribute("value", artist);
            }
        }
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
            <div class="mb_content_container">
                ${this.config.show_version ? html`<div>${CARD_VERSION}</div>` : ""}
                ${this.config.entity ? this._createLinkEntity() : html``}
                <div>
                    ${this._searchInput}
                    <mwc-button
                        class="form-button"
                        label="Search"
                        raised
                        @click="${this._searchArtists}"
                        }></mwc-button>
                    <mwc-button class="form-button" label="Clear" raised @click="${this._clearResult}" }></mwc-button>
                </div>
                <div id="result-musicbrainz"></div>
            </div>
        `;
    }

    private _createLinkEntity() {
        const entity = this.config.entity;
        let artist;
        if (entity) {
            const entityState = this.hass.states[entity];
            artist = entityState.attributes.media_artist;
        }

        return html`<div class="mb_entity_control">
            <span class="mb_entity_label"> </span>
            <!-- <span id="entity_artist" }>${artist ? artist : html``} </span
            > -->
            <ha-textfield
                id="entity_artist"
                class="rounded"
                disabled
                label="Currently playing in entity"
                value=${artist ? artist : html``}></ha-textfield>
            <mwc-button class="form-button" label="search" raised @click="${this._searchWithEntity}" }></mwc-button>
        </div>`;
    }

    private _createReleaseGroups(releaseGroups) {
        const a = releaseGroups.sort(function (a, b) {
            const type = a["primary-type"].localeCompare(b["primary-type"]);
            if (type != 0) return type;
            if (!a["first-release-date"] || !b["first-release-date"]) return type;
            return b["first-release-date"].localeCompare(a["first-release-date"]);
        });

        const primaryTypes = [...new Set(a.map(data => data["primary-type"]))];

        const resultDiv = document.createElement("div");
        resultDiv.id = "result";
        resultDiv.className = "mb_results";

        primaryTypes.map(item => {
            const itemS = item as string;

            const primaryTypeDiv = document.createElement("div");
            primaryTypeDiv.className = "mb_rg_type";
            primaryTypeDiv.innerHTML = itemS;

            const containerDiv = document.createElement("div");
            containerDiv.className = "mb_rg_type_container";

            const primaryTypesDiv = document.createElement("div");
            primaryTypesDiv.className = "mb_rg_container";
            primaryTypesDiv.append(primaryTypeDiv);
            primaryTypesDiv.append(containerDiv);

            resultDiv.append(primaryTypesDiv);

            this._filterTypes(a, item).map(res => {
                const titleDiv = document.createElement("div");
                titleDiv.className = "mb_rg_detail_title";
                titleDiv.innerHTML = res["title"];

                const releaseIcon = document.createElement("ha-icon");
                releaseIcon.setAttribute("icon", "mdi:calendar");
                const releaseDiv = document.createElement("div");
                releaseDiv.className = "mb_rg_detail_release";
                releaseDiv.append(releaseIcon);
                releaseDiv.innerHTML = res["first-release-date"] ? res["first-release-date"] : "";

                const detailTypesIcon = document.createElement("ha-icon");
                detailTypesIcon.setAttribute("icon", "mdi:shape-outline");
                const detailTypesDiv = document.createElement("div");
                detailTypesDiv.className = "mb_rg_detail_types";
                detailTypesDiv.append(detailTypesIcon);
                detailTypesDiv.innerHTML = res["secondary-types"] ? res["secondary-types"] : "";

                const imgCoverIcon = document.createElement("ha-icon");
                imgCoverIcon.id = "covericon_" + res["id"];
                imgCoverIcon.setAttribute("icon", "mdi:disc");
                const coverDiv = document.createElement("div");
                coverDiv.id = "coverdiv_" + res["id"];
                coverDiv.className = "mb_rg_detail_cover";
                coverDiv.append(imgCoverIcon);

                this.getCover(res);

                const detailGrid = document.createElement("div");
                detailGrid.className = "mb_rg_grid_detail";
                detailGrid.append(titleDiv);
                detailGrid.append(releaseDiv);
                detailGrid.append(detailTypesDiv);
                detailGrid.append(coverDiv);

                containerDiv.append(detailGrid);
            });
        });

        return resultDiv;
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

                    const coverDivId = "#coverdiv_" + item.id;
                    const coverIconId = "#covericon_" + item.id;
                    const divCover = this.shadowRoot?.querySelector(coverDivId) as HTMLElement;
                    const coverIcon = this.shadowRoot?.querySelector(coverIconId) as HTMLElement;
                    if (coverIcon) {
                        divCover.removeChild(coverIcon);
                    }

                    const imgCover = document.createElement("img");
                    imgCover.setAttribute("src", urlImg);
                    imgCover.className = "mb_rg_detail_cover_img";
                    divCover.append(imgCover);
                })
                .catch(error => {
                    console.error("Error:", error);
                });
        }
    }

    private _filterTypes(json, value) {
        const result = json.filter(item => {
            return item["primary-type"] == value;
        });

        return result;
    }

    private _createArtistsResult(artists) {
        const artistsDiv = document.createElement("div");
        artistsDiv.id = "result";
        artistsDiv.className = "mb_results";

        artists.map(item => {
            const artistBtn = document.createElement("div");
            artistBtn.className = "mb_artist_btn";

            const btn = document.createElement("ha-icon");
            btn.setAttribute("icon", "mdi:disc");
            btn.addEventListener("click", () => this.searchReleaseGroups(item["id"]));
            artistBtn.append(btn);

            const nameDiv = document.createElement("div");
            nameDiv.className = "mb_artist_name";
            const name = item.name + " " + (item["country"] ? "(" + item["country"] + ")" : "");
            nameDiv.innerHTML = name;

            const activityDiv = document.createElement("div");
            activityDiv.className = "mb_artist_activity";
            const lifespan = item["life-span"]["begin"] ? item["life-span"]["begin"] : "";
            item["life-span"]["end"] ? lifespan + " >>> " + item["life-span"]["end"] : "";
            activityDiv.innerHTML = lifespan;

            const infoDiv = document.createElement("div");
            infoDiv.className = "mb_artist_info";
            infoDiv.innerHTML = item["disambiguation"] ? item["disambiguation"] : "";

            const artistGrid = document.createElement("div");
            artistGrid.className = "mb_artist_grid";
            artistGrid.append(artistBtn);
            artistGrid.append(nameDiv);
            artistGrid.append(activityDiv);
            artistGrid.append(infoDiv);

            artistsDiv.append(artistGrid);
        });

        return artistsDiv;
    }

    private _searchWithEntity() {
        const artistEl = this.shadowRoot?.querySelector("#entity_artist") as HTMLElement;
        const t = artistEl.getAttribute("value");
        console.log(t);
        this._searchInput.value = t;
        this._searchArtists();
    }

    private _searchArtists() {
        const searchText = this._searchInput.value;

        let url = "http://musicbrainz.org/ws/2/artist/?fmt=json&query=artist:" + searchText;
        url = encodeURI(url);
        console.log(url);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                this.fillArtists(data.artists);
            });
    }

    private getResultElement() {
        return this.shadowRoot?.querySelector("#result-musicbrainz") as HTMLElement;
    }

    private _clearResult() {
        const divMB = this.getResultElement();
        const divresult = this.shadowRoot?.querySelector("#result") as HTMLElement;
        if (divresult) {
            divMB.removeChild(divresult);
        }
    }

    private fillArtists(artists) {
        this._clearResult();
        this.getResultElement().append(this._createArtistsResult(artists));
    }

    private fillResultGroups(resultGroups) {
        this._clearResult();
        this.getResultElement().append(this._createReleaseGroups(resultGroups));
    }

    private searchReleaseGroups(artistId) {
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

                this.fillResultGroups(tmp);
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

            .mb_content_container {
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: auto;
                row-gap: 20px;
                margin: 10px;
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
                font-size: 20px;
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
                row-gap: 10px;
            }

            .mb_rg_grid_detail {
                display: grid;
                gap: 3px;
                grid-template-columns: auto 1fr auto;
                grid-template-rows: auto;
            }
            .mb_rg_detail_title {
                grid-column: 2 / 4;
                grid-row: 1;
                font-weight: bold;
            }

            .mb_rg_detail_release {
                grid-column: 3;
                grid-row: 1;
                text-align: right;
            }

            .mb_rg_detail_types {
                grid-column: 2;
                grid-row: 2;
                font-style: italic;
            }
            .mb_rg_detail_cover {
                grid-column: 1;
                grid-row: 1 / 4;
                border: 1px solid white;
                background-color: grey;
                width: 70px;
                height: 70px;
            }

            .mb_rg_detail_cover_img {
                width: 70px;
                height: 70px;
            }

            .mb_entity_control {
                display: grid;
                gap: 5px;
                grid-template-columns: 1fr auto auto;
                grid-template-rows: auto;
            }

            .mb_entity_label {
                text-align: right;
                font-weight: bold;
            }
        `;
    }
}

