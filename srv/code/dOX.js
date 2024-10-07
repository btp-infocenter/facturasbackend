/**
 * Manejador de eventos @On para el evento 'dox' en la entidad 'Fotos' del servicio 'uploadPhoto'.
 * Al crear una nueva foto, se manda automáticamente a procesar usando Document Information Extraction (DOX).
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

const cap_doxlib = require('./lib_cap_dox'); // Importar librería para interacciones con DOX

/* Procesa la imagen asociada a una nueva foto y genera los datos correspondientes */
module.exports = async function (request) {
  const { Fotos, DatosHeader, DatosItems } = cds.entities('facturasbackendService'); 
  const fotos_ID = request.params[0]; // ID de la foto obtenida de los parámetros
  const dato_ID = cap_doxlib.randomId(fotos_ID); // Generar un ID aleatorio para el dato

  console.log('Starting extraction ...'); // Indicar que comienza la extracción

  // Obtener los datos de la foto desde la base de datos
  const foto = await SELECT.one
    .from(Fotos)
    .where({ ID: fotos_ID });

  const imagen = foto.imagen; // Extraer la imagen de los datos de la foto

  // Configuración para el procesamiento de DOX (Extracción de Documentos)
  const options = {
    "headerFields": [
      "nombreRemitente",
      "rucRemitente",
      "timbrado"
    ],
    "lineItemFields": "descripcion",
    "clientId": "default",
    "documentType": "invoice",
    "schemaName": "Factura_schema",
    "templateId": "detect",
    "candidateTemplateIds": ["ticket"]
  };

  // Obtener token de autenticación para interactuar con DOX
  const auth_token = await cap_doxlib.auth_token();

  // Simulación de job ID (en lugar de enviar la imagen para procesar, se asigna un job ID directamente)
  // let job_id = "894e053e-ccb8-4d44-b2da-5b59b00a0232";

  let job_id = await cap_doxlib.post_job(imagen, options, auth_token);

  if (job_id) {
    // Obtener el estado del trabajo de procesamiento en DOX
    let dox_output = await cap_doxlib.get_job_status(job_id, auth_token);

    // Preparar los datos para DatosHeader
    const datosHeaderInit = {
      "ID": dato_ID,
      "fotos_ID": fotos_ID,
      "status": dox_output.status,
      "doxId": dox_output.id,
      "autoCreado": true, // Indicar que el dato fue creado automáticamente
    };

    // Campos de cabecera extraídos por DOX
    const headerFields = dox_output.extraction.headerFields;
    const headerFieldNames = ["nombreRemitente", "rucRemitente", "timbrado"];

    // Generar cabecera de DatosHeader usando la librería de procesamiento
    const header = await cap_doxlib.headerFieldGen(datosHeaderInit, headerFields, headerFieldNames);

    // Preparar los datos para DatosItems
    const datosItemsInit = {
      "datosHeader_ID": dato_ID
    };

    // Campos de ítems extraídos por DOX
    const itemsFields = dox_output.extraction.lineItems;
    const itemsFieldNames = ["descripcion", "precioUnitario"];

    // Generar ítems de DatosItems usando la librería de procesamiento
    const items = await cap_doxlib.itemsFieldGen(datosItemsInit, itemsFields, itemsFieldNames);

    // Insertar los datos generados en DatosHeader
    await INSERT.into(DatosHeader)
      .entries(header)
      .then(
        console.log("👍 Creado-datosAutoGenerados") // Confirmación de la creación de DatosHeader
      );

    // Insertar los ítems generados en DatosItems
    await INSERT.into(DatosItems)
      .entries(items)
      .then(
        console.log("👍 Creado-items") // Confirmación de la creación de DatosItems
      );

  } else {
    request.error("Can not initialize DOX"); // Error si no se puede inicializar el procesamiento en DOX
  }
};
