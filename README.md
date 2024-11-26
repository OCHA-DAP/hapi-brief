HAPI instant briefing
=====================

Generate an instant humanitarian briefing for a country, admin1, or admin2 using the [The Humanitarian API](https://hdx-hapi.readthedocs.io/en/latest/) (HAPI), maintained by the UN [Centre for Humanitarian Data](https://centre.humdata.org).

Live link: https://davidmegginson.github.io/hapi-brief/locations.html


## Setup

1. Obtain a free HAPI API key from https://hapi.humdata.org/docs#/Generate%20App%20Identifier/get_encoded_identifier_api_v1_encode_app_identifier_get
2. Edit ``docs/scripts/local.js`` and set the _API\_KEY_ constant to your own API key.
3. Put the ``docs/` folder online.


## Usage

Choose a location (country), then follow through to an admin1 or admin2, as appropriate.


## Code overview

This is entirely a browser-side application, based in [docs/](docs/) as the root.  Each of the HTML files inside docs will redraw itself after loading the appropriate data from HAPI.

The core script is [hapi-brief.js](docs/scripts/hapi-brief.js), which reads the GET parameters, loads the appropriate data from HAPI, then uses the [Nunjucks]() library to redraw the page using templates stored in [docs/templates/](docs/templates/).  Those templates in turn include reusable template fragments from inside [docs/templates/includes/](docs/templates/includes/).

The templates (especially the includes) take advantage of the simple _Data Filter_ (DF) library to do dynamic context-sensitive data filtering on the fly, reducing the burden on the main script.  For more information, see [README.DF.md](README.DF.md).

Note that the templates are _not_ precompiled for this demo.  Most of the processing time is around data, not rendering, so it provides almost no performance benefit.

The calls to HAPI in ``hapi-brief.js`` happen in sequence (using ``await``) rather than in parallel, so that the "loading" messages are meaningful and HAPI doesn't get hit with a lot of requests at once.  There might be a small performance benefit in running them in parallel and waiting until all the promises resolve.


## Author

Started 2024-10-07 by David Megginson

This is a personal project.  The Centre for Humanitarian Data is not responsible for its accuracy or maintenance.


## License

Public domain: see [UNLICENSE.md](UNLICENSE.md) for details
