const PCODE = "AF0101";

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

function redraw_html (error_message, html) {
    if (error_message) {
        alert(error_message);
    } else {
        document.documentElement.innerHTML = html;
    }
}


async function render_admin2 () {
    let data = { stop_list: STOP_LIST };
    data.admin2 = await get_data("metadata", "admin2", "&code=" + PCODE);
    data.admin2 = data.admin2[0];

    data.idps = await get_data("affected-people", "idps", "&admin2_code=" + PCODE);
    data.humanitarian_needs = await get_data("affected-people", "humanitarian-needs", "&admin2_code=" + PCODE);
    data.operational_presence = await get_data("coordination-context", "operational-presence", "&admin2_code=" + PCODE);
    data.population = await get_data("population-social", "population", "&admin2_code=" + PCODE);

    console.log(data);
    nunjucks.configure({
        autoescape: true,
        web: { async: true }
    });
    nunjucks.render('templates/index.template.html', data, redraw_html);
}

async function get_data (category, subcategory, query) {
    let url = "https://hapi.humdata.org/api/v1/" + category + "/" + subcategory + "?app_identifier=" + API_KEY + query;
    console.log(url);
    let response = await fetch(url);
    let data = await response.json();
    return data.data;
}


window.addEventListener("load", render_admin2);


