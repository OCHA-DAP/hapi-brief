""" Download data from a HAPI endpoint into a static CSV file with HXL hashtags.

Usage:

  python3 download-hapi-subcategory CATEGORY SUBCATEGORY > OUTPUT.csv

Before use, copy config.json.TEMPLATE to config.json and fill in the values. See README.md for details.

Started 2024-08-01 by David Megginson

"""

import csv, json, os, requests, sys


SCRIPT_DIRECTORY = os.path.dirname(os.path.realpath(__file__))
""" Directory where this script lives (for loading input data) """


CONFIG = {}
""" Configuration information loaded from config.json """
with open(os.path.join(SCRIPT_DIRECTORY, "config.json"), "r") as input:
    CONFIG = json.load(input)

    
HEADER_HASHTAG_MAP = {}
""" Map from HAPI field names to HXL hashtags """
with open(os.path.join(SCRIPT_DIRECTORY, "inputs/hashtag-map.json"), "r") as input:
    HEADER_HASHTAG_MAP = json.load(input)


URL_TEMPLATE = 'https://{host}/api/v1/{category}/{subcategory}?app_identifier={api_key}=&output_format=json&offset={offset}&limit={limit}'
""" Template for calls to HAPI """


def make_hashtag_row (category, subcategory, headers):
    """ Create a row of HXL hashtags corresponding to the HAPI fields """

    def lookup (category, subcategory, header):
        if category in HEADER_HASHTAG_MAP:
            if subcategory in HEADER_HASHTAG_MAP[category]:
                if header in HEADER_HASHTAG_MAP[category][subcategory]:
                    return HEADER_HASHTAG_MAP[category][subcategory][header]
        return HEADER_HASHTAG_MAP['DEFAULT'].get(header, '')

    result = []
    for header in headers:
        result.append(lookup(category, subcategory, header))
    return result


def download_data (fid, category, subcategory):
    """ Download the HAPI data and print to the selected file stream """
    
    seen_header = False

    offset = 0
    limit = CONFIG.get('limit', 1000)

    output = csv.writer(fid)

    while True:
        r = requests.get(URL_TEMPLATE.format(
            host=CONFIG['hapi-host'],
            api_key=CONFIG['api-key'],
            category=category,
            subcategory=subcategory,
            offset=offset,
            limit=limit,
        ))
        r.raise_for_status()
        result = r.json()
        if len(result["data"]) <= 0:
            break
        else:
            for row in result["data"]:
                if not seen_header:
                    seen_header = True
                    output.writerow(row.keys())
                    output.writerow(make_hashtag_row(category, subcategory, row.keys()))
                output.writerow(row.values())
        offset += limit

#
# Script entry point
#
if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: {} <category> <subcategory>".format(sys.argv[0]), file=sys.stderr)
        exit(2)
    category = sys.argv[1]
    subcategory=sys.argv[2]
    download_data(sys.stdout, category, subcategory)
    exit(0)
