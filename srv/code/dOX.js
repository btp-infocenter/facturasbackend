/**
 * Manejador de eventos @On para el evento 'dox' en la entidad 'Fotos' del servicio 'uploadPhoto'.
 * Al crear una nueva foto, se manda automáticamente a procesar usando Document Information Extraction (DOX).
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

const cap_doxlib = require('./lib_cap_dox'); // Importar librería para interacciones con DOX

/* Procesa la imagen asociada a una nueva foto y genera los datos correspondientes */
module.exports = async function (request) {

  const { Fotos, Items, Datos, Values } = cds.entities('facturasbackend');
  const foto_ID = request.params[0]; // ID de la foto obtenida de los parámetros

  console.log('Starting extraction ...'); // Indicar que comienza la extracción

  // Obtener la imagen de la foto desde la base de datos
  const { imagen, mimetype } = await SELECT.one
    .from(Fotos)
    .columns(['imagen', 'mimetype'])
    .where({ ID: foto_ID })

  // Configuración para el procesamiento de DOX (Extracción de Documentos)
  const options = {
    "headerFields": [
      "fechaFactura",
      "nroFactura",
      "timbrado",
      "ruc",
      "rucCliente",
      "nombre",
      "direccion",
      "ciudad",
      "telefono",
      "condVenta",
      "totalFactura",
      "totalIva5",
      "totalIva10",
      "moneda",
      "codigoQR",
      "cdc"
    ],
    "lineItemFields": [
      "descripcion",
      "cantidad",
      "importe",
      "precioUnitario",
      "indImpuesto",
      "codigo"
    ],
    "clientId": "default",
    "documentType": "invoice",
    "schemaName": "facturasCajaChicaS4Esquema3",
    "templateId": "detect",
    "candidateTemplateIds": [
      "facturasCajaChicaS4Plantilla3"
    ]
  };

  const title = typeof process.env.cap_dox_key_uaa === 'undefined' ?
    `${new Date().toLocaleTimeString("es-US", { hour12: false, timeZone: "America/Asuncion" })} [test]` :
    `${new Date().toLocaleTimeString("es-US", { hour12: false, timeZone: "America/Asuncion" })}`

  // Obtener token de autenticación para interactuar con DOX
  const auth_token = await cap_doxlib.auth_token();

  const img = {
    base64: imagen,
    title: title,
    mimetype: mimetype
  }

  // Enviar la imagen para procesar usando DOX
  let job_id = await cap_doxlib.post_job(img, options, auth_token);

  // let job_id = '3582b35d-c2c2-40ba-9c61-3cf5c0182e41'
  // console.log('> > > > >')
  // console.log('> > ATENCION: JOB_ID COMO CONSTANTE < < < < ')
  // console.log('> > > > >')

  console.log(`DOX id >>> ${job_id} <<<`)
  // let job_id = '4e224d4e-b2b3-4348-a224-bb86f4dbd8ff'

  if (job_id) {
    // Obtener el estado del trabajo de procesamiento en DOX
    let dox_output = await cap_doxlib.get_job_status(job_id, auth_token);

    // Campos de cabecera extraídos por DOX
    let headerFields = dox_output.extraction.headerFields;
    const lineItems = dox_output.extraction.lineItems;
    const headerFieldNames = options.headerFields;
    const itemsFieldNames = options.lineItemFields;

    if (headerFields.find(item => item.name == "totalFactura").value == null) {
      const monto = lineItems
        .flatMap(item => item) // Flatten nested arrays
        .filter(subItem => subItem.name === "importe") // Only "importe" items
        .reduce((total, subItem) => total + subItem.value, 0); // Sum the "importe" values

        headerFields.find(item => item.name == "totalFactura").value = monto;
    }

    // Arrays para almacenar las entradas de las tablas
    let itemsEntries = [];
    let datosEntries = [];
    let valuesEntries = [];

    // Procesar cada línea de ítems extraídos
    for (let iitem of lineItems) {
      let itemid = cap_doxlib.randomId(foto_ID); // Generar un nuevo ID para el ítem
      itemsEntries.push({
        ID: itemid,
        fotos_ID: foto_ID
      });

      // Extraer los campos relacionados con los ítems
      for (let field of iitem) {
        if (itemsFieldNames.includes(field.name)) {
          let datoid = cap_doxlib.randomId(foto_ID); // Generar ID para los datos extraídos

          datosEntries.push({
            ID: datoid,
            items_ID: itemid,
            name: field.name,
            label: field.label,
            confidence: field.confidence,
            model: field.type,
            coordinates_x: field.coordinates.x,
            coordinates_y: field.coordinates.y,
            coordinates_w: field.coordinates.w,
            coordinates_h: field.coordinates.h,
          });

          if (field.value != null) {
            valuesEntries.push({
              datos_ID: datoid,
              value: field.value,
              autoCreado: true,
              enviado: false
            });
          }
        }
      }
    }

    // Procesar los campos de cabecera extraídos
    for (let field of headerFields) {
      if (headerFieldNames.includes(field.name)) {
        let datoid = cap_doxlib.randomId(foto_ID); // Generar ID para los datos extraídos

        datosEntries.push({
          ID: datoid,
          fotos_ID: foto_ID,
          name: field.name,
          label: field.label,
          confidence: field.confidence,
          model: field.type,
          coordinates_x: field.coordinates.x,
          coordinates_y: field.coordinates.y,
          coordinates_w: field.coordinates.w,
          coordinates_h: field.coordinates.h
        });

        if (field.value != null) {
          valuesEntries.push({
            datos_ID: datoid,
            value: field.value,
            autoCreado: true,
            enviado: false
          });
        }
      }
    }

    // Insertar las entradas en las tablas Items, Datos y Values
    await INSERT.into(Items).entries(itemsEntries);
    await INSERT.into(Datos).entries(datosEntries);
    await INSERT.into(Values).entries(valuesEntries);

    // Actualizar la entidad Fotos con el ID y el estado del trabajo de DOX
    await UPDATE.entity(Fotos)
      .data({
        doxID: job_id,
        status: dox_output.status
      });

  } else {
    // Mostrar error si no se puede inicializar el procesamiento en DOX
    request.error("Can not initialize DOX");
  }
};
