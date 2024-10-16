const API_KEY = "SERYLWRhdmlkOm1lZ2dpbnNvbkB1bi5vcmc=";


// HTTP GET parameters
const searchParams = new URLSearchParams(window.location.search);

const HAPI_HOST = "hapi.humdata.org";

const PAGE_SIZE = 10000;

// const STOP_LIST = [
//     'location_ref',
//     'location_code',
//     'location_name',
//     'admin1_ref',
//     'admin1_code',
//     'admin1_name',
//     'admin2_ref',
//     'admin2_code',
//     'admin2_name',
//     'resource_hdx_id',
//     'sector_code',
//     'org_type_code',
// ];

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

    data.location = await get_data("metadata", "location", { code: pcode });
    data.location = data.location.first();
    data.geo = data.location;
    data.geo_type = 'location';
    
    data.admin1s = await get_data("metadata", "admin1", { location_code: pcode });

    data.population = await get_data("population-social", "population", { admin_level: 0, location_code: pcode });

    data.humanitarian_needs = await get_data("affected-people", "humanitarian-needs", { admin_level: 0, location_code: pcode });

    data.operational_presence = await get_data("coordination-context", "operational-presence", { location_code: pcode });

    data.funding = await get_data("coordination-context", "funding", { location_code: pcode });

    data.refugees = await get_data("affected-people", "refugees", { asylum_location_code: pcode });

    data.returnees = await get_data("affected-people", "returnees", { asylum_location_code: pcode });

    data.idps = await get_data("affected-people", "idps", { admin_level: 0, location_code: pcode });

    data.national_risk = await get_data("coordination-context", "national-risk", { location_code: pcode });

    data.sectors = get_sectors([data.operational_presence, data.humanitarian_needs]);


    nunjucks.render('templates/location.template.html', data, redraw_html);
}


/**
 * Look up data for an admin1 page and render it as HTML.
 */
async function render_admin1 () {
    let pcode = searchParams.get("code");
    let data = { stop_list: STOP_LIST };

    data.admin1 = await get_data("metadata", "admin1", "&code=" + pcode);
    data.admin1 = data.admin1.first();
    data.geo = data.admin1;

    data.admin2s = await get_data("metadata", "admin2", "&admin1_code=" + pcode);

    data.population = await get_data("population-social", "population", "&admin_level=1&admin1_code=" + pcode);

    data.humanitarian_needs = await get_data("affected-people", "humanitarian-needs", "&admin_level=1&admin1_code=" + pcode);

    data.operational_presence = await get_data("coordination-context", "operational-presence", "&admin1_code=" + pcode);
    
    data.idps = await get_data("affected-people", "idps", "&admin1_code=" + pcode);

    data.sectors = get_sectors([data.operational_presence, data.humanitarian_needs]);

    nunjucks.render('templates/admin1.template.html', data, redraw_html);
}


/**
 * Look up data for an admin2 page and render it as HTML.
 */
async function render_admin2 () {
    let pcode = searchParams.get("code");
    let data = { stop_list: STOP_LIST };

    data.admin2 = await get_data("metadata", "admin2", "&code=" + pcode);
    data.admin2 = data.admin2.first();
    data.geo = data.admin2;
    
    data.population = await get_data("population-social", "population", "&admin_level=2&admin2_code=" + pcode);

    data.humanitarian_needs = await get_data("affected-people", "humanitarian-needs", "&admin_level=2&admin2_code=" + pcode);

    data.operational_presence = await get_data("coordination-context", "operational-presence", "&admin2_code=" + pcode);

    data.idps = await get_data("affected-people", "idps", "&admin2_code=" + pcode);

    data.sectors = get_sectors([data.operational_presence, data.humanitarian_needs]);

    nunjucks.render('templates/admin2.template.html', data, redraw_html);
}


/**
 * Look up a complete data table and render it as HTML.
 */
async function render_table () {
    let data = { facet: "table", stop_list: STOP_LIST }

    console.log(data);

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
        console.log(data.sector);
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

    data.resource = await get_data("metadata", "resource", { resource_hdx_id: data.data.first().resource_hdx_id });
    
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
            for (var row of data.aggregate(['sector_name', 'sector_code'])) {
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
