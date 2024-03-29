/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, TemplateResult, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor, getLovelace, hasConfigOrEntityChanged } from "custom-card-helpers";
import { localize } from "./localize/localize";
import "./editor";
import type { KodiMusicBrainzCardConfig } from "./types";
import { CARD_VERSION, DEFAULT_ENTITY_NAME, PRIMARYY_TYPES, SECONDARY_TYPES } from "./const";

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

    private _card;
    private _searchInput;
    private _mediaPlayerInput;
    private _alreadyRunned = false;
    private _lastArtistSearched = null;
    private filters = new Map<string, boolean>();
    @state() private config!: KodiMusicBrainzCardConfig;

    // TODO Add any properities that should cause your element to re-render here
    // https://lit.dev/docs/components/properties/
    @property({ attribute: false }) public hass!: HomeAssistant;

    public setConfig(config: KodiMusicBrainzCardConfig): void {
        // TODO Check for required fields and that they are of the proper format
        if (!config) {
            throw new Error(localize("common.invalid_configuration"));
        }

        if (config.test_gui) {
            getLovelace().setEditMode(true);
        }

        this.config = config;
        this._alreadyRunned = false;

        for (const key in PRIMARYY_TYPES) {
            const id = PRIMARYY_TYPES[key].id;
            this.filters.set(id, this.config[id] ? this.config[id] : false);
        }
        for (const key in SECONDARY_TYPES) {
            const id = SECONDARY_TYPES[key].id;
            this.filters.set(id, this.config[id] ? this.config[id] : false);
        }
    }

    public getCardSize(): number {
        return 1;
    }

    // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
    protected shouldUpdate(changedProps: PropertyValues): boolean {
        if (!this.config || !this.config.entity) {
            return false;
        }

        return hasConfigOrEntityChanged(this, changedProps, false);
    }

    // https://lit.dev/docs/components/rendering/
    protected render(): TemplateResult | void {
        let errorMessage;
        let searchTxt = null;
        if (this._searchInput) {
            searchTxt = this._searchInput.value;
        }

        if (!this._alreadyRunned) {
            this._card = html`
                <ha-card
                    .header=${this.config.title ? this.config.title : ""}
                    tabindex="0"
                    .label=${`Kodi MusicBrainz ${this.config.entity || "No Entity Defined"}`}>
                    <div class="card-container">${errorMessage ? errorMessage : this.buildCardContainer()}</div>
                </ha-card>
            `;
            this._alreadyRunned = true;
        }

        if (searchTxt) {
            this._searchInput.value = searchTxt;
        }

        if (this.config.entity && this._alreadyRunned) {
            this.fillMediaPlayerArtist(this.config.entity);
        }

        return this._card;
    }

    private fillMediaPlayerArtist(entity) {
        const entityState = this.hass.states[entity];
        const btnEl = document.getElementById("search_artist_btn");
        if (entityState["attributes"]["media_artist"]) {
            const artist = entityState["attributes"]["media_artist"];
            this._mediaPlayerInput.setAttribute("value", artist);
            this._mediaPlayerInput.setAttribute("label", "Currently playing in entity");
            btnEl?.setAttribute("enabled", "");
        } else {
            this._mediaPlayerInput.setAttribute("value", "");
            this._mediaPlayerInput.setAttribute("label", "No artist playing");
            btnEl?.setAttribute("disabled", "");
        }
    }

    private buildCardContainer() {
        this._searchInput = document.createElement("ha-textfield");
        this._searchInput.setAttribute("outlined", "");
        this._searchInput.setAttribute("label", "Search criteria");
        this._searchInput.setAttribute("class", "form-button");
        this._searchInput.addEventListener("keydown", event => {
            if (event.code === "Enter") {
                this.searchFromInput();
            }
        });

        return html`
            <div class="mb_content_container">
                ${this.config.show_version ? html`<div>${CARD_VERSION}</div>` : ""}
                ${this.config.entity ? this.createMediaPlayerElements() : html``}
                <div class="mb_form_grid">
                    ${this._searchInput}
                    <div class="mb_button_grid">
                        <mwc-button
                            class="form-button"
                            label="Search"
                            raised
                            @click="${this.searchFromInputButton}"
                            }></mwc-button>
                        <mwc-button
                            class="form-button"
                            label="Clear"
                            raised
                            @click="${this.clearResultListButton}"
                            }></mwc-button>
                    </div>

                    ${!this.config.show_filter_primaryType
                        ? ""
                        : html`
                              <div class="mb_form_filters">
                                  <div class="mb_form_filters_title_primary">Primary Type</div>
                                  <div class="mb_form_filters_primary">${this.createPrimaryTypesEl()}</div>
                              </div>
                          `}
                    ${!this.config.show_filter_secondaryType
                        ? ""
                        : html`
                              <div class="mb_form_filters">
                                  <div class="mb_form_filters_title_secondary">Secondary Type</div>
                                  <div class="mb_form_filters_secondary">${this.createSecondaryTypesEl()}</div>
                              </div>
                          `}

                    <div id="result-musicbrainz"></div>
                </div>
            </div>
        `;
    }
    private clearResultListButton() {
        this.clearResultList();
        this._searchInput.value = "";
        this._lastArtistSearched = null;
    }
    private searchFromInputButton() {
        this._lastArtistSearched = null;
        this.searchFromInput();
    }
    private createTypeEl(type) {
        let selected = this.filters.get(type.id);
        selected = selected == undefined ? false : selected;

        return html`<div class="mb_form_filter_type">
            <ha-formfield class="switch-wrapper" label="${type.mb_query}"
                ><ha-switch id=${type.id} @change=${this.filterChanged} .checked=${selected}> </ha-switch
            ></ha-formfield>
        </div>`;
    }
    private createPrimaryTypesEl() {
        const itemTemplates: TemplateResult[] = [];
        for (const key of Object.keys(PRIMARYY_TYPES)) {
            itemTemplates.push(this.createTypeEl(PRIMARYY_TYPES[key]));
        }
        return itemTemplates;
    }

    private createSecondaryTypesEl() {
        const itemTemplates: TemplateResult[] = [];
        for (const key of Object.keys(SECONDARY_TYPES)) {
            itemTemplates.push(this.createTypeEl(SECONDARY_TYPES[key]));
        }
        return itemTemplates;
    }

    private filterChanged(ev) {
        this.filters.set(ev.target.id, ev.target.checked);
        if (this._lastArtistSearched != null) {
            this.searchReleaseGroups(this._lastArtistSearched);
        }
    }

    private createMediaPlayerElements() {
        const entity = this.config.entity;
        let entityState;

        this._mediaPlayerInput = document.createElement("ha-textfield");
        this._mediaPlayerInput.id = "entity_artist";
        this._mediaPlayerInput.className = "rounded";
        this._mediaPlayerInput.setAttribute("disabled", "");

        const searchBtn = document.createElement("mwc-button");
        searchBtn.id = "search_artist_btn";
        searchBtn.className = "form-button";
        searchBtn.setAttribute("raised", "");
        searchBtn.setAttribute("Label", "search");
        searchBtn.addEventListener("click", this.searchFromMediaPlayer.bind(this));

        if (entity) {
            entityState = this.hass.states[entity];
        }
        if (entityState["attributes"]["media_artist"]) {
            this._mediaPlayerInput.setAttribute("Label", "Currently playing");
            this._mediaPlayerInput.setAttribute("value", entityState["attributes"]["media_artist"]);
            searchBtn.setAttribute("enabled", "");
        } else {
            this._mediaPlayerInput.setAttribute("Label", "No artist playing");
            this._mediaPlayerInput.setAttribute("value", "");
            searchBtn.setAttribute("disabled", "");
        }
        return html`<div class="mb_entity_control">${this._mediaPlayerInput}${searchBtn}</div>`;
    }

    private createReleaseGroupsList(releaseGroups) {
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

            this.filterByTypes(a, item).map(res => {
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
        if (item["releases"] != undefined && item["releases"][0]) {
            const releaseId = item["releases"][0]["id"];

            let url = "https://coverartarchive.org/release/" + releaseId;
            url = encodeURI(url);

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

    private filterByTypes(json, value) {
        const result = json.filter(item => {
            return item["primary-type"] == value;
        });

        return result;
    }

    private createArtistsList(artists) {
        const artistsDiv = document.createElement("div");
        artistsDiv.id = "result";
        artistsDiv.className = "mb_results";

        artists.map(item => {
            const artistBtn = document.createElement("div");
            artistBtn.className = "mb_artist_btn";

            const btn = document.createElement("ha-icon");
            btn.setAttribute("icon", "mdi:account");
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

    private searchFromMediaPlayer() {
        this._searchInput.value = this._mediaPlayerInput.value;
        this.searchFromInput();
    }

    private searchFromInput() {
        const searchText = this._searchInput.value;

        let url = "https://musicbrainz.org/ws/2/artist/?fmt=json&query=artist:" + searchText;
        url = encodeURI(url);
        fetch(url)
            .then(response => response.json())
            .then(data => {
                this.fillArtistsList(data.artists);
            });
    }

    private getResultElement() {
        return this.shadowRoot?.querySelector("#result-musicbrainz") as HTMLElement;
    }

    private clearResultList() {
        const divMB = this.getResultElement();
        const divresult = this.shadowRoot?.querySelector("#result") as HTMLElement;
        if (divresult) {
            divMB.removeChild(divresult);
        }
    }

    private fillArtistsList(artists) {
        this.clearResultList();
        this.getResultElement().append(this.createArtistsList(artists));
    }

    private fillReleaseGroupsList(resultGroups) {
        this.clearResultList();
        this.getResultElement().append(this.createReleaseGroupsList(resultGroups));
    }

    private searchReleaseGroups(artistId) {
        this._lastArtistSearched = artistId;
        let typeFilter = "";
        for (const key of Object.keys(SECONDARY_TYPES)) {
            typeFilter += this.filters.get(SECONDARY_TYPES[key].id)
                ? ""
                : " AND NOT secondarytype:" + SECONDARY_TYPES[key].mb_query;
        }

        const queryURL: string[] = [];
        for (const key of Object.keys(PRIMARYY_TYPES)) {
            if (this.filters.get(PRIMARYY_TYPES[key].id)) {
                queryURL.push(
                    "https://musicbrainz.org/ws/2/release-group/?fmt=json&query=arid:" +
                        artistId +
                        " AND primarytype:" +
                        PRIMARYY_TYPES[key].mb_query +
                        typeFilter,
                );
            }
        }

        const fetched: Promise<Response>[] = [];
        for (const url of queryURL) {
            fetched.push(fetch(encodeURI(url)));
        }

        Promise.all(fetched)
            .then(function (responses) {
                // Get a JSON object from each of the responses
                return Promise.all(
                    responses.map(function (response) {
                        return response.json();
                    }),
                );
            })
            .then(data => {
                let tmp = [];
                data.forEach(element => {
                    tmp = tmp.concat(element["release-groups"]);
                });

                this.fillReleaseGroupsList(tmp);
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
                grid-column: 2 / 3;
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

            .mb_button_grid {
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: auto;
                gap: 5px;
            }
            .mb_form_grid {
                display: grid;
                grid-template-columns: 1fr auto;
                grid-template-rows: auto;
                gap: 5px;
            }

            .mb_form_filters {
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: auto;
                align-items: center;
                grid-column: 1 / 3;
            }

            .mb_form_filter_type {
                display: grid;
                grid-template-columns: auto auto;
                grid-template-rows: auto;
                align-items: center;
            }

            .mb_form_filters_title_primary,
            .mb_form_filters_title_secondary {
                font-weight: bold;
            }

            .mb_form_filters_secondary,
            .mb_form_filters_primary {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 20px;
            }

            #result-musicbrainz {
                grid-column: 1 / 3;
            }
        `;
    }
}

