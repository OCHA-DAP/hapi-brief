Create static copies of HAPI data
=================================

Download data from [The Humanitarian API](https://hdx-hapi.readthedocs.io/en/latest/) (HAPI), maintained by the UN [Centre for Humanitarian Data](https://centre.humdata.org).

## Setup

Copy ``config.json.TEMPLATE`` to ``config.json`` and fill in the values.  You will need a HAPI API key from https://hapi.humdata.org/docs#/Utility/get_encoded_identifier_api_v1_encode_identifier_get

## Usage

The script will download the full contents of a HAPI endpoint, given a category and subcategory as arguments.  For example, to download the operational-presence endpoint in the context-coordination category, use

    $ python3 download-hapi-subcategory.py context-coordination operational-presence > output.csv
    
## HXL support

The output will contain [HXL](https://hxlstandard.org) hashtags, controlled by the map in ``inputs/hashtag-map.json`` .  The script looks first for a mapping under the specific category and subcategory, and if that fails, it looks for a mapping under "DEFAULT".  If no mapping is found, the HXL hashtag will be omitted for that column.

## Caveat

This is a personal project.  The Centre for Humanitarian Data is not responsible for its accuracy or maintenance.


Started 2024-08-01 by David Megginson

Public domain: see [UNLICENSE.md](UNLICENSE.md) for details
