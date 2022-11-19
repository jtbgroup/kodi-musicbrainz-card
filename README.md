[![HACS Default][hacs_shield]][hacs]
[![Buy me a coffee][buy_me_a_coffee_shield]][buy_me_a_coffee]

[hacs_shield]: https://img.shields.io/static/v1.svg?label=HACS&message=Default&style=popout&color=green&labelColor=41bdf5&logo=HomeAssistantCommunityStore&logoColor=white
[hacs]: https://hacs.xyz/docs/default_repositories

[buy_me_a_coffee_shield]: https://img.shields.io/static/v1.svg?label=%20&message=Buy%20me%20a%20coffee&color=6f4e37&logo=buy%20me%20a%20coffee&logoColor=white
[buy_me_a_coffee]: https://www.buymeacoffee.com/jtbgroup


# Kodi-MusicBrainz-Card

This card can be used to search into the MusicBrainz database for a specific artist. It can be used in combination with a media player entity to directly get the artist name currently playing.

## Requirements

No specific requirement. If you want to link the card with a player entity, the player must have an attribute called `media_artist` in the state of the entity. This is the case for the kodi integration.

## Features

Search an artist in the MusicBrainz database

## Installation

1. Install the card using HACS

Manual installation is of course possible, but not explained here as there are plenty of tutorials.

## Card options

| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string | **required** | 1.0.0 | `custom:kodi-musicbrainz-card` |
| entity | string | **required** | 1.0.0 |  `media_player.kodi_example` |
| title | string | optional | 1.0.0 | The title of the card |
| show_version | boolean | false | 4.4 | Shows the version of the card directly on the card. This is mainly useful for develpment purposes. |

**No need to pass the entity of the Kodi player as it is embedded in the data of the sensor.**

Example

``` yaml
    type: custom:kodi-playlist-card
    entity: media_player.kodi_example
``
