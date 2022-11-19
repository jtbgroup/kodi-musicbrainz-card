[![HACS Default][hacs_shield]][hacs]
[![Buy me a coffee][buy_me_a_coffee_shield]][buy_me_a_coffee]

[hacs_shield]: https://img.shields.io/static/v1.svg?label=HACS&message=Default&style=popout&color=green&labelColor=41bdf5&logo=HomeAssistantCommunityStore&logoColor=white
[hacs]: https://hacs.xyz/docs/default_repositories

[buy_me_a_coffee_shield]: https://img.shields.io/static/v1.svg?label=%20&message=Buy%20me%20a%20coffee&color=6f4e37&logo=buy%20me%20a%20coffee&logoColor=white
[buy_me_a_coffee]: https://www.buymeacoffee.com/jtbgroup


# Kodi-MusicBrainz-Card

This card displays the playlist running on the kodi entity. The refresh is automatic based on events triggered by the entity.

## Requirements

This card requires a specific sensor that gets the data from Kodi. The sensor is provided by the custom component [Kodi Media Sensors](https://github.com/jtbgroup/kodi-media-sensors). Keep this integration up to date to avoid strange behaviour of your card.

## Features

The card will let you track the playlist of kodi.
You can perform some actions directly from the card like removing an item from the playlist or play a specific entry in the playlist.

## Installation

1. Install the custom component [Kodi Media Sensors](https://github.com/jtbgroup/kodi-media-sensors).
2. Install the card using HACS

Manual installation is of course possible, but not explained here as there are plenty of tutorials.

## Card options

| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string | **required** | 1.0.0 | `custom:kodi-musicbrainz-card` |
| entity | string | **required** | 1.0.0 |  `sensor.kodi_playlist` |
| title | string | optional | 1.0.0 | The title of the card |
| show_version | boolean | false | 4.4 | Shows the version of the card directly on the card. This is mainly useful for develpment purposes. |

**No need to pass the entity of the Kodi player as it is embedded in the data of the sensor.**

Example

``` yaml
    type: custom:kodi-playlist-card
    entity: sensor.kodi_media_sensor_playlist
    show_thumbnail: true
    show_thumbnail_border: true
    show_thumbnail_overlay: true
    show_line_separator: true
    outline_color: rgb(245,12,54)
``
