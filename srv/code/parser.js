const cds = require('@sap/cds');
const { get_job, auth_token } = require('./lib_cap_dox');
const { get_supplier } = require('./lib_cap_s4');

async function getRaw(foto_ID) {
    const { Fotos } = cds.entities('facturasminibackend');

    const { doxID } = await SELECT.one
        .from(Fotos)
        .where({ ID: foto_ID });


    if (!doxID) {
        return ({ error: 'Imagen no procesada' })
    }

    const token = await auth_token();

    const res = await get_job(doxID, token);

    if (res.error)
        return ({ error: 'DOX_ID Incorrecto' })

    // console.log('[700]', res.GT.extraction , '[701]')

    if (res.AI.status == 'ERROR') {
        request.error('Imagen no procesable')
        return ({ error: 'Imagen no procesable' })
    }

    return res
}

async function parse2Apps(foto_ID) {

    const res = await getRaw(foto_ID)

    /* USE FOR TESTING
                {
                    value: "null", //item.value == null ? null : item.value.toString(),
                    coordinates: { x: 0.1, y: 0.1, w: 0.1, h: 0.1 },//item.coordinates,
                    confidence: 0.1, //item.confidence,
                    label: item.label,
                    type: item.type,
                    valorAI: "null"//null
                }
    */

    let datos = Object.fromEntries(
        res.GT.extraction.headerFields.map((item) => [
            item.name,
            {
                value: item.value == null ? null : item.value.toString(),
                coordinates: item.coordinates,
                confidence: item.confidence,
                label: item.label,
                type: item.type,
                valorAI: null
            }
        ])
    )

    for (let field of res.AI.extraction.headerFields) {
        datos[field.name].valorAI = field.value.toString()
    }

    let lines = []

    for (let i in res.GT.extraction.lineItems) {
        let newline = Object.fromEntries(
            res.GT.extraction.lineItems[i].map((item) => [
                item.name,
                {
                    value: item.value == null ? null : item.value.toString(),
                    coordinates: item.coordinates,
                    confidence: item.confidence,
                    label: item.label,
                    type: item.type,
                    valorAI: null
                }
            ])
        )

        for (let field of res.AI.extraction.lineItems[i]) {
            newline[field.name].valorAI = field.value.toString()
        }

        lines.push(newline)
    }


    datos['lineItems'] = lines

    datos['foto_ID'] = foto_ID

    return (datos)
}

async function parse2s4(foto_ID) {
    const res = await getRaw(foto_ID)

    let datos = {}
    const headerFields = res.GT.extraction.headerFields
    const lineItems = res.GT.extraction.lineItems

    let DocumentCurrency = headerFields.find(({ name }) => name == 'moneda').value
    const supplier = await get_supplier(headerFields.find(({ name }) => name == 'ruc').value)
    let fecha = headerFields.find(({ name }) => name == 'fechaFactura').value
    fecha = new Date(fecha).toISOString().split('T')[0] + 'T00:00:00'

    datos['DocumentCurrency'] = "PYG" // DocumentCurrency
    datos['Supplier'] = supplier
    
    datos['SupplierInvoiceIDByInvcgParty'] = headerFields.find(({ name }) => name == 'nroFactura').value
    datos['InvoicingParty'] = supplier
    datos['DocumentDate'] = fecha
    datos['InvoiceGrossAmount'] = headerFields.find(({ name }) => name == 'totalFactura').value.toString()

    datos['lineItems'] = []

    let counter = 0

    for (let item of lineItems) {
        let iva = item.find(({ name }) => name == 'indImpuesto').value
        iva = iva.includes('10') ? 'C1' : iva.includes('5') ? 'C2' : 'C0'
        let importe_neto = item.find(({ name }) => name == 'importe').value
        let descripcion = item.find(({ name }) => name == 'descripcion').value
        let cantidad = item.find(({ name }) => name == 'cantidad').value

        let material = item.find(({ name }) => name == 'material').value
        material = material.split(":")[0]

        counter++
        let importe_bruto = importe_neto * (iva == 'C1' ? (10/11) : iva == 'C2' ? (20/21) : 1)

        let newline = {
            PurchaseOrderItem: counter.toString(),
            TaxCode: iva,
            NetPriceAmount: importe_neto.toString(),
            PurchaseOrderItemText: descripcion,
            OrderQuantity: cantidad.toString(),

            SupplierInvoiceItem: counter.toString(),
            SupplierInvoiceItemAmount: importe_bruto.toString(),
            SuplrInvcAcctAssignmentAmount: importe_bruto.toString(),
            AccountAssignmentNumber: "1",
            Quantity: cantidad.toString(),
            Material: material
        }

        datos['lineItems'].push(newline)
    }

    return datos
}

module.exports = {
    parse2Apps: async function (foto_ID) {
        return await parse2Apps(foto_ID);
    },
    parse2s4: async function (foto_ID) {
        return await parse2s4(foto_ID);
    }
}