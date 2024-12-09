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
        name: "INFOCENTER_160",
        url: "http://10.20.10.144:8000",
    });
}

async function post_factura(obj) {
    try {
        const result = await executeHttpRequest(
            { destinationName: "INFOCENTER_160"},
            {
                method: "post",
                url: "/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice",
                headers: {
                    'Accept': 'application/json',
                    'sap-language': 'ES'
                },
                data: obj,
            }
        );

        return result.data.d.SupplierInvoice

    } catch (err) {
        let error = err.response.data?.error

        if (error == undefined)
            error = err
        console.error(error)
        console.log("FIN DEL ERROR")

        return ({ error })
    }

}

async function post_orden(obj) {
    try {
        const result = await executeHttpRequest(
            { destinationName: "INFOCENTER_160"},
            {
                method: "post",
                url: "/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder",
                headers: {
                    'Accept': 'application/json',
                    'sap-language': 'ES'
                },
                data: obj,
            }
        );

        return result.data.d.PurchaseOrder

    } catch (err) {
        let error = err.response.data?.error

        if (error == undefined)
            error = err

        console.error(error)
        console.log("FIN DEL ERROR")
        return ({ error })
    }
}

async function post_material(obj) {
    try {
        const result = await executeHttpRequest(
            {
                destinationName: "INFOCENTER_160"
            },
            {
                method: "post",
                url: "/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader",
                headers: {
                    'Accept': 'application/json'
                },
                data: obj,
            }
        );

        return result.data.d.MaterialDocument

    } catch (err) {
        console.log('[MATERIAL ERROR]')

        let error = err.response.data?.error?.innererror?.errordetails

        if (error == undefined)
            error = err
        console.error(error)
        console.log("FIN DEL ERROR")
        return ({ error })
    }
}
async function get_supplier(ruc) {
    ruc = ruc.toString();
    ruc = ruc[ruc.length - 2] !== '-' ? ruc.slice(0, -1) + '-' + ruc.slice(-1) : ruc

    try {
        const result = await executeHttpRequest(
            {
                destinationName: "INFOCENTER_160"
            },
            {
                method: "get",
                url: `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier?$format=json&sap-client=160&$filter=TaxNumber1 eq'${ruc}'`,
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const Supplier = result.data.d.results[0].Supplier

        return Supplier

    } catch (err) {
        console.log('[MATERIAL ERROR]')

        let error = err.response.data?.error?.innererror?.errordetails

        if (error == undefined)
            error = err
        console.error(error)
        console.log("FIN DEL ERROR")
        return ({ error })
    }
}


module.exports = {
    post_factura: async function (obj) {
        return await post_factura(obj);
    },
    post_orden: async function (obj) {
        return await post_orden(obj);
    },
    post_material: async function (obj) {
        return await post_material(obj);
    },
    get_supplier: async function (ruc) {
        return await get_supplier(ruc)
    }
}