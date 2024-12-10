const cds = require("@sap/cds");
const { get_job, auth_token } = require("./lib_cap_dox");
const { get_supplier } = require("./lib_cap_s4");
const { get_schema } = require("./documentai");
const { array } = require("@sap/cds");

async function parse2Apps(photo_ID) {
  const { Datos } = cds.entities("facturasminibackend");

  // const r = await SELECT.one.from(Photos).where({ID: photo_ID})
  const rawdatos = await SELECT.from(Datos).where({
    photos_ID: photo_ID,
    item: null,
  });

  const rawitems = await SELECT.from(Datos).where({
    photos_ID: photo_ID,
    item: { "!=": null },
  });

  let datos = Object.fromEntries(
    rawdatos.map((item) => [
      item.name,
      {
        value: item.value,
        coordinates: {
          x: item.coordinates_x,
          y: item.coordinates_y,
          h: item.coordinates_h,
          w: item.coordinates_w,
        },
        confidence: item.confidence,
        label: null,
        type: null,
        valorAI: item.valorAI,
      },
    ])
  );

  items = [];

  for (let item of rawitems) {
    console.log(item);

    if (!items[item.item]) {
      items[item.item] = [];
    }

    items[item.item].push({
      [item.name]: {
        value: item.value,
        coordinates: {
          x: item.coordinates_x,
          y: item.coordinates_y,
          h: item.coordinates_h,
          w: item.coordinates_w,
        },
        confidence: item.confidence,
        label: null,
        type: null,
        valorAI: item.valorAI,
      },
    });
  }

  datos["lineItems"] = items;

  datos["photo_ID"] = photo_ID;

  return datos;
}

async function parse2s4(photo_ID) {
  const { Datos } = cds.entities("facturasminibackend");

  const headerFields = await SELECT.from(Datos).where({
    and: { photos_ID: photo_ID, item: null },
  });
  const lineItems = await SELECT.from(Datos).where({
    and: { photos_ID: photo_ID, item: { "!=": null } },
  });

  console.log('[200]',headerFields,'[201]',lineItems,'[202]')

  let datos = {}

  let DocumentCurrency = headerFields.find(
    ({ name }) => name == "moneda"
  ).value;
  const supplier = await get_supplier(
    headerFields.find(({ name }) => name == "ruc").value
  );
  let fecha = headerFields.find(({ name }) => name == "fechaFactura").value;
  fecha = new Date(fecha).toISOString().split("T")[0] + "T00:00:00";

  datos["DocumentCurrency"] = "PYG"; // DocumentCurrency
  datos["Supplier"] = supplier;

  datos["SupplierInvoiceIDByInvcgParty"] = headerFields.find(
    ({ name }) => name == "nroFactura"
  ).value;
  datos["InvoicingParty"] = supplier;
  datos["DocumentDate"] = fecha;
  datos["InvoiceGrossAmount"] = headerFields
    .find(({ name }) => name == "totalFactura")
    .value.toString();

  datos["lineItems"] = [];

  let counter = 0;

  for (let item of lineItems) {
    let iva = item.find(({ name }) => name == "indImpuesto").value;
    iva = iva.includes("10") ? "C1" : iva.includes("5") ? "C2" : "C0";
    let importe_neto = item.find(({ name }) => name == "importe").value;
    let descripcion = item.find(({ name }) => name == "descripcion").value;
    let cantidad = item.find(({ name }) => name == "cantidad").value;

    let material = item.find(({ name }) => name == "material").value;
    material = material.split(":")[0];

    counter++;
    let importe_bruto =
      importe_neto * (iva == "C1" ? 10 / 11 : iva == "C2" ? 20 / 21 : 1);

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
      Material: material,
    };

    datos["lineItems"].push(newline);
  }

  console.log(datos)

  return datos;
}

function mapitems(item, photos_ID, count = null, isnull = false) {
  const vertices = isnull
    ? null
    : item.pageAnchor.pageRefs[0].boundingPoly.normalizedVertices;

  const res = {
    name: isnull ? item : item.type,
    value: isnull
      ? null
      : item.normalizedValue == null
      ? item.mentionText
      : item.normalizedValue.text,
    valorAI: isnull
      ? null
      : item.normalizedValue == null
      ? item.mentionText
      : item.normalizedValue.text,
    confidence: isnull ? null : item.confidence,
    coordinates_x: isnull ? null : vertices[0].x,
    coordinates_y: isnull ? null : vertices[0].y,
    coordinates_w: isnull ? null : vertices[2].x - vertices[0].x,
    coordinates_h: isnull ? null : vertices[2].y - vertices[0].y,
    item: count,
    photos_ID,
  };

  return res;
}

async function docai2cap(raw, photos_ID) {
  var { header, items } = await get_schema();

  raw_headers = raw.filter((item) => item.type != "Items");
  raw_items = raw
    .filter((item) => item.type == "Items")
    .map((item) => item.properties);

  const actHeader = raw_headers.map((item) => item.type);
  const actItems = raw_items.map((bigitem) => bigitem.map((item) => item.type));

  items = Array(actItems.length).fill(items);

  header = header.filter(
    (item) => item !== "Items" && !actHeader.includes(item)
  );

  for (let i in items)
    items[i] = items[i].filter((item) => !actItems[i].includes(item));

  let datos = [];

  datos = raw_headers.map((item) => mapitems(item, photos_ID));

  for (let i in raw_items) {
    for (let item of raw_items[i])
      datos.push(mapitems(item, photos_ID, Number(i)));
  }

  for (let item of header) datos.push(mapitems(item, photos_ID, null, true));

  for (let i in items) {
    for (let item of items[i]) {
      datos.push(mapitems(item, photos_ID, Number(i), true));
    }
  }

  return datos;
}

module.exports = {
  parse2Apps: async function (photo_ID) {
    return await parse2Apps(photo_ID);
  },
  parse2s4: async function (photo_ID) {
    return await parse2s4(photo_ID);
  },
  docai2cap: async function (raw, photos_ID) {
    return await docai2cap(raw, photos_ID);
  },
};
