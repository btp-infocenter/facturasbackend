const axios = require("axios");
const FormData = require("form-data");
const cds = require("@sap/cds");
const { Readable } = require("stream");
const { log } = require("console");
const { chown } = require("fs");
const b1 = cds.env.b1; // Accede a las credenciales del servicio DOX desde package.json
const cap_b1_key_uaa =
    typeof process.env.cap_b1_key_uaa === "undefined"
        ? cds.env.requires.cap_b1_key_uaa // Accede a las credenciales desde .env si no están en el entorno de Fiori.
        : JSON.parse(process.env.cap_b1_key_uaa); // Accede a las variables de entorno si está desplegado en Fiori.

const { setTestDestination } = require("@sap-cloud-sdk/test-util");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

let cookies = "";

setTestDestination({
    trustStoreCertificate: true,
    name: "INFOCENTER_B1",
    url: "https://10.20.10.102:50000",
    cloudConnectorLocationId: "INFOCENTER_I4D"
});

async function get_cookies() {
    try {
        const result = await executeHttpRequest(
            { destinationName: "b1" },
            {
                method: "post",
                url: "/Login",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    CompanyDB: "Z_FETEST",
                    Password: "Admin123@",
                    UserName: "manager",
                },
            },
            {
                fetchCsrfToken: false,
            }
        );
        cookies = result.headers["set-cookie"].join(";");
        console.log("[ cookies updated ]");

        return cookies;
    } catch (error) {
        console.error("Error at [get_cookies]:", error); // Log the full error object
        return { error: error };
    }
}

async function get_drafts(args) {
    try {
        const result = await executeHttpRequest(
            { destinationName: "b1" },
            {
                method: "get",
                url: `Drafts${args}`,
                headers: {
                    Cookie: cookies,
                },
            }
        );

        return result.data;
    } catch (error) {
        console.error("Error at [get_drafts]:", error);
        return { error: error };
    }
}

async function post_drafts(obj) {
    const {
        ruc,
        date,
        factura,
        totalNeto,
        rendicion,
        concepto,
        salesPerson,
        timbrado,
        lineItems,
    } = obj;

    const proveedor = "AAA";

    const data = {
        CardCode: `P${ruc}`,
        DocDate: date,
        NumAtCard: factura,
        U_ESTA: `${factura.split("-")[0]}`,
        U_PEMI: `${factura.split("-")[1]}`,
        FolioNumber: `${factura.split("-")[2]}`,
        DocTotal: totalNeto,
        Comments: `${rendicion} - CAJA CHICA GS - ${concepto}`,
        JournalMemo: `${proveedor} - ${factura}`,
        salesPersonCode: salesPerson,
        DocObjectCode: "oPurchaseInvoices",
        FederanTaxID: `${ruc}`,
        UserSign: "",
        TransNum: "",
        FolioPrefixString: "",
        ControlAccount: "",
        U_TIMB: timbrado,
        U_RTipo: "5",
        U_Rendicion: `${rendicion}`,
        DocumentLines: lineItems.map((item) => ({
            ItemCode: item.code,
            Quantity: item.quantity,
            Price: item.bruto,
            CostingCode: "INFOO",
            CoatingCode2: "INFOO2",
            CostingCode3: "AAA",
            ProjectCode: "3000",
            TaxCode: item.tax,
        })),
    };

    console.log("[101]", data, "[101]");

    // try {
    //   const result = await executeHttpRequest(
    //     { destinationName: "b1" },
    //     {
    //       method: "post",
    //       url: `Drafts`,
    //       headers: {
    //         Cookie: cookies,
    //       },
    //       data: data,
    //     }
    //   );

    //   return result.data;
    // } catch (error) {
    //   console.error("Error at [post_drafts]:", error.response.data);
    //   return { error: error };
    // }
}

async function check_bp(ruc) {
    try {
        const result = await executeHttpRequest(
            { destinationName: "b1" },
            {
                method: "get",
                url: `BusinessPartners('${ruc}')`,
                headers: {
                    Cookie: cookies,
                }
            }
        );

        return true;
    } catch (error) {
        if (error.response.status == 404)
            return false

        console.error("Error at [test_drafts]:", error.response.data);
        return { error: error };
    }
}

async function auth(func, ...args) {
    let res = await func(...args);

    if (res?.error?.status === 401) {
        console.log(" --> retrieving cookies");
        await get_cookies();
        res = await func(...args);
    }

    return res;
}

async function ping() {
    const res = await executeHttpRequest(
        { destinationName: "INFOCENTER_B1" },
        {
            method: "get",
            url: "/ping",
        }
    )

    console.log(res)
}

// Exporta funciones para su uso en otros módulos
module.exports = {
    auth: async function (func, args) {
        return await auth(func, args); // Obtiene el token de autenticación
    },
    get_drafts: async function (args) {
        return await get_drafts(args);
    },
    post_drafts: async function (args) {
        return await post_drafts(args);
    },
    check_bp: async function (ruc) {
        return await check_bp(ruc);
    },
    ping: async function () {
        return await ping()
    }
};
