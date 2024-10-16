////////////////////////////////////////////////////////////////////////
// Generate key figures from the Humanitarian API (HAPI) as web pages.
//
// Started 2024-10 by David Megginson
////////////////////////////////////////////////////////////////////////

// Change to your own API key
const API_KEY = "SERYLWRhdmlkOm1lZ2dpbnNvbkB1bi5vcmc=";


// HTTP GET parameters
const searchParams = new URLSearchParams(window.location.search);

const HAPI_HOST = "hapi.humdata.org";

const PAGE_SIZE = 10000;

// Exclude from data tables
const STOP_LIST = [
    'origin_location_ref',
    'asylum_location_ref',
    'location_ref',
    'admin1_ref',
    'admin2_ref',
    'sector_code',
    'org_type_code',
    'resource_hdx_id'
];


// Set up the templating system.
let nunjucks_env = nunjucks.configure({
    autoescape: true,
    web: { async: true }
});
nunjucks_env.addFilter("nfmt", n => (new Intl.NumberFormat().format(n)));


/**
 * Look up the list of HRP countries and render as HTML.
 */
async function render_locations () {
    let data = { stop_list: STOP_LIST };
    data.filter = searchParams.get("filter");
    if (!data.filter) {
        data.filter = "hrp";
    }
    let params = {};
    if (data.filter == "hrp") {
        params.has_hrp = true;
    } else if (data.filter == "gho") {
        params.in_gho = true;
    }
    data.locations = await get_data("metadata", "location", params);
    nunjucks.render('templates/locations.template.html', data, redraw_html);
}


/**
 * Look up data for a location (country) page and render it as HTML.
 */
async function render_location () {
    let pcode = searchParams.get("code");
    let data = { stop_list: STOP_LIST };

    data.location = await get_row("metadata", "location", { code: pcode });
    data.admin_level = 0;
    data.geo = data.location;
    data.geo_type = 'location';

    // Grab the admin1 list
    data.admin1s = await get_data("metadata", "admin1", { location_code: pcode });

    // Grab the subcategories
    data.population = await get_subcategory("population-social", "population", { admin_level: 0, location_code: pcode });
    data.humanitarian_needs = await get_subcategory("affected-people", "humanitarian-needs", { admin_level: 0, location_code: pcode });
    data.operational_presence = await get_subcategory("coordination-context", "operational-presence", { location_code: pcode });
    data.funding = await get_subcategory("coordination-context", "funding", { location_code: pcode });
    data.refugees = await get_subcategory("affected-people", "refugees", { asylum_location_code: pcode });
    data.returnees = await get_subcategory("affected-people", "returnees", { asylum_location_code: pcode });
    data.idps = await get_subcategory("affected-people", "idps", { admin_level: 0, location_code: pcode });
    data.national_risk = await get_subcategory("coordination-context", "national-risk", { location_code: pcode });

    // Extract the sectors from 3W and PIN data
    data.sectors = get_sectors([data.operational_presence, data.humanitarian_needs]);

    // Render the page
    nunjucks.render('templates/location.template.html', data, redraw_html);
}


/**
 * Look up data for an admin1 page and render it as HTML.
 */
async function render_admin1 () {
    let pcode = searchParams.get("code");
    let data = { stop_list: STOP_LIST };

    data.admin1 = await get_row("metadata", "admin1", { code: pcode });
    data.admin_level = 1;
    data.geo = data.admin1;
    data.geo_type = 'admin1';

    data.admin2s = await get_data("metadata", "admin2", { admin1_code: pcode });

    data.population = await get_subcategory("population-social", "population", { admin_level: 1, admin1_code: pcode });
    data.humanitarian_needs = await get_subcategory("affected-people", "humanitarian-needs", { admin_level: 1, admin1_code: pcode });
    data.operational_presence = await get_subcategory("coordination-context", "operational-presence", { admin1_code: pcode });
    data.idps = await get_subcategory("affected-people", "idps", { admin_level: 1, admin1_code: pcode });

    data.sectors = get_sectors([data.operational_presence, data.humanitarian_needs]);

    nunjucks.render('templates/admin1.template.html', data, redraw_html);
}


/**
 * Look up data for an admin2 page and render it as HTML.
 */
async function render_admin2 () {
    let pcode = searchParams.get("code");
    let data = { stop_list: STOP_LIST };

    data.admin2 = await get_row("metadata", "admin2", { code: pcode });
    data.admin_level = 2;
    data.geo = data.admin2;
    data.geo_type = 'admin2';
    
    data.population = await get_subcategory("population-social", "population", { admin_level: 2, admin2_code: pcode });
    data.humanitarian_needs = await get_subcategory("affected-people", "humanitarian-needs", { admin_level: 2, admin2_code: pcode });
    data.operational_presence = await get_subcategory("coordination-context", "operational-presence", { admin2_code: pcode });
    data.idps = await get_subcategory("affected-people", "idps", { admin_level: 2, admin2_code: pcode });

    data.sectors = get_sectors([data.operational_presence, data.humanitarian_needs]);


    nunjucks.render('templates/admin2.template.html', data, redraw_html);
}


/**
 * Look up a complete data table and render it as HTML.
 */
async function render_table () {
    let data = { facet: "table", stop_list: STOP_LIST }

    data.category = searchParams.get("category")
    data.subcategory = searchParams.get("subcategory")
    data.location_code = searchParams.get("location-code")
    data.admin1_code = searchParams.get("admin1-code")
    data.admin2_code = searchParams.get("admin2-code")
    data.sector_code = searchParams.get("sector-code")
    data.admin_level = searchParams.get("admin-level");

    let params = {};

    for (key of [ 'location_code', 'admin1_code', 'admin2_code', 'sector_code', 'admin_level' ]) {
        if (data[key]) {
            params[key] = data[key];
        }
    }

    if (data.sector_code) {
        data.sector = await get_data("metadata", "sector", { code: data.sector_code });
        data.sector = data.sector.first();
    }

    if (data.admin2_code) {
        data.geo = await get_data("metadata", "admin2", { code: data.admin2_code });
    } else if (data.admin1_code) {
        data.geo = await get_data("metadata", "admin1", { code: data.admin1_code });
    } else {
        data.geo = await get_data("metadata", "location", { code: data.location_code });
    }

    data.geo = data.geo.first()

    data.title = "Data: " + capitalize(data.subcategory.replace('-', ' ')) + " for " + data.geo.name
    if (data.sector) {
        data.title += " (" + data.sector.name + ")";
    }
    data.data = await get_data(data.category, data.subcategory, params);

    data.resources = await get_resources(data.data);

    nunjucks.render('templates/table.template.html', data, redraw_html);
}


//
// Data-preparation functions
//


// Merge any sectors from operational presence and humanitarian needs
function get_sectors (datasets) {
    let sector_map = {};
    let result = [];
    for (var data of datasets) {
        if (data) {
            for (var row of data.data.aggregate(['sector_name', 'sector_code'])) {
                sector_map[row.sector_code] = row.sector_name;
            }
        }
    }
    for (let [key, value] of Object.entries(sector_map)) {
        result.push({ code: key, name: value });
    }
    return result;
}


//
// Rendering functions
//


/**
 * Redraw the current web page with Nunjucks output.
 */
function redraw_html (error_message, html) {
    if (error_message) {
        alert(error_message);
    } else {
        document.documentElement.innerHTML = html;
    }
}

function capitalize (s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}


//
// Data-access functions
//


/**
 * Return a list of HDX resource sources for data.
 */
async function get_resources (data) {
    let resources = [];
    for (let resource_id of data.values('resource_hdx_id')) {
        resources.push(await get_row('metadata', 'resource', { resource_hdx_id: resource_id }));
    }
    return new DF.Data(resources);
}


/**
 * Return a subcategory object with extra metadata
 */
async function get_subcategory (category, subcategory, params) {
    let result = {};
    result.params = params;

    // API values
    result.data = await get_data(category, subcategory, params);
    result.resources = await get_resources(result.data);

    // calculated values
    result.has_data = result.data.length() > 0;
    if (result.has_data) {
        result.start_date = result.data.min('reference_period_start');
        result.end_date = result.data.max('reference_period_end');
        result.latest_date = result.data.max('reference_period_start');
        result.sources = result.resources.values('dataset_hdx_provider_name');
    }
    
    return result;
}


/**
 * Return the first match for a HAPI query.
 */
async function get_row (category, subcategory, params) {
    let data = await get_data(category, subcategory, params);
    if (data.length() > 0) {
        return data.first();
    } else {
        return null;
    }
}


/**
 * Download data from HAPI.
 */
async function get_data (category, subcategory, params) {
    let result = [];
    let finished = false;
    let offset = 0;

    params = {...params};
    params['app_identifier'] = API_KEY;
    params['limit'] = PAGE_SIZE;

    while (!finished) {
        params['offset'] = offset;
        let url = "https://hapi.humdata.org/api/v1/" + category + "/" + subcategory + "?" + new URLSearchParams(params).toString();
        console.log(url);
        let response = await fetch(url);
        let data = await response.json();
        result.push(...data.data);
        if (data.data.length < PAGE_SIZE) {
            finished = true;
        } else {
            offset += PAGE_SIZE;
        }
    }
    return new DF.Data(result);
}

// end
