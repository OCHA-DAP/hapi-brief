nunjucks.configure({
    autoescape: true,
    web: { async: true }
});

let searchParams = new URLSearchParams();

let pcode = searchParams.get("admin2-code");
if (!pcode) {
    pcode = "AF0101";
}

const API_KEY = "SERYLWRhdmlkOm1lZ2dpbnNvbkB1bi5vcmc=";

const HAPI_HOST = "hapi.humdata.org";

const PAGE_SIZE = 1000;

const STOP_LIST = [
    'location_ref',
    'location_code',
    'location_name',
    'admin1_ref',
    'admin1_code',
    'admin1_name',
    'admin2_ref',
    'admin2_code',
    'admin2_name',
    'resource_hdx_id',
    'sector_code',
    'org_type_code',
];

const DATA = {
    admin2_name: 'Subdistrict 01',
    admin1_name: 'District A',
    country_name: 'Foolandia',
}

function get_param (name, default_value) {
    let searchParams = new URLSearchParams(window.location.search);

    let value = searchParams.get(name);
    if (!value) {
        value = default_value;
    }
    return value;
}


function redraw_html (error_message, html) {
    if (error_message) {
        alert(error_message);
    } else {
        document.documentElement.innerHTML = html;
    }
}


function process_availability (data) {
    let result = {};
    let level = 0;
    data.forEach(row => {
        let key = row.subcategory;
        if (!(key in result)) {
            result[key] = [];
        }
        if (row.admin2_code) {
            result[key][2] = true;
        } else if (row.admin1_code) {
            result[key][1] = true;
        } else {
            result[key][0] = true;
        }
    });
    return result;
}


/**
 * Look up the list of HRP countries and render as HTML.
 */
async function render_locations () {
    let data = { stop_list: STOP_LIST };
    data.locations = await get_data("metadata", "location", "&has_hrp=true");
    nunjucks.render('templates/locations.template.html', data, redraw_html);
}


/**
 * Look up data for a location (country) page and render it as HTML.
 */
async function render_location () {
    let pcode = get_param("code", "VEN");
    let data = { stop_list: STOP_LIST };
    data.location = await get_data("metadata", "location", "&code=" + pcode);
    data.location = data.location[0];
    data.admin1s = await get_data("metadata", "admin1", "&location_code=" + pcode);
    nunjucks.render('templates/location.template.html', data, redraw_html);
}


/**
 * Look up data for an admin1 page and render it as HTML.
 */
async function render_admin1 () {
    let pcode = get_param("code");
    let data = { stop_list: STOP_LIST };
    data.admin1 = await get_data("metadata", "admin1", "&code=" + pcode);
    data.admin1 = data.admin1[0];
    data.admin2s = await get_data("metadata", "admin2", "&admin1_code=" + pcode);
    nunjucks.render('templates/admin1.template.html', data, redraw_html);
}


/**
 * Look up data for an admin2 page and render it as HTML.
 */
async function render_admin2 () {
    let pcode = get_param("code");
    let data = { stop_list: STOP_LIST };
    data.admin2 = await get_data("metadata", "admin2", "&code=" + pcode);
    data.admin2 = data.admin2[0];
    data.idps = await get_data("affected-people", "idps", "&admin2_code=" + pcode);
    data.humanitarian_needs = await get_data("affected-people", "humanitarian-needs", "&location_code=" + data.admin2.location_code);
    data.operational_presence = await get_data("coordination-context", "operational-presence", "&admin2_code=" + pcode);
    data.population = await get_data("population-social", "population", "&admin2_code=" + pcode);
    nunjucks.render('templates/admin2.template.html', data, redraw_html);
}

async function get_data (category, subcategory, query) {
    let url = "https://hapi.humdata.org/api/v1/" + category + "/" + subcategory + "?app_identifier=" + API_KEY + query;
    console.log(url);
    let response = await fetch(url);
    let data = await response.json();
    return data.data;
}
