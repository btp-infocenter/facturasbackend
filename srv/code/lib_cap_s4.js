const axios = require("axios");
const FormData = require("form-data");
const cds = require("@sap/cds");
const { Readable } = require("stream");
const { log } = require("console");
const { chown } = require("fs");
const s4 = cds.env.s4;
const cap_s4_key_uaa =
    typeof process.env.cap_s4_key_uaa === "undefined"
        ? cds.env.requires.cap_s4_key_uaa // Accede a las credenciales desde .env si no están en el entorno de Fiori.
        : JSON.parse(process.env.cap_s4_key_uaa); // Accede a las variables de entorno si está desplegado en Fiori.

const { setTestDestination } = require("@sap-cloud-sdk/test-util");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

let cookies = "";

if (typeof process.env.cap_s4_key_uaa === "undefined") {
    setTestDestination({
        name: "INFOCENTER_200",
        url: "http://10.20.10.144:8000",
    });
}

async function post_factura(obj) {
    try {
        const result = await executeHttpRequest(
            { destinationName: "INFOCENTER_200" },
            {
                method: "post",
                url: '/sap/bc/rest/dox/factura',
                headers: {
                    'Accept': 'application/json'
                },
                data: obj,
            }
        );

        if (result.data[0].type == 'S') {
            console.log('[10]', result.data[0].message, '[10]')
            return result.data[0].message
        } else {
            console.log('[S4 error]', result.data)
            return { error: result.data }
        }
    } catch (error) {
        console.error("Error at [post_facturas]:", error)
        return { error: error.data }
    }

}

module.exports = {
    post_factura: async function (obj) {
        return await post_factura(obj);
    }
}