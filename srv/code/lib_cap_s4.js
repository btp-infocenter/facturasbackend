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

setTestDestination({
    authentication: "NoAuthentication",
    name: "s4",
    isTrustingAllCertificates: true,
    url: "http://10.20.10.144:8000/sap/bc/rest/dox/factura?sap-client=100",
});

async function post_factura(obj) {
    var basic_auth = cap_s4_key_uaa.clientid + ':' + cap_s4_key_uaa.clientsecret;

    console.log("[01]")

    try {
        const result = await executeHttpRequest(
            { destinationName: "s4" },
            {
                method: "post",
                url: '',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(basic_auth).toString('base64'),
                    'Accept': 'application/json'
                },
                data: obj,
            }
        );
        console.log("[03]")

        return result
    } catch (error) {
        // console.error("Error at [post_facturas]:", error)
        console.log("[02]")
        return { error: error.data }
    }
    
}

module.exports = {
    post_factura: async function (obj) {
        return await post_factura(obj);
    }
}