const axios = require("axios");
const FormData = require('form-data');
const cds = require('@sap/cds');
const { Readable } = require('stream');
const { log } = require("console");
const cap_dox_key = cds.env.cap_dox_key;      // Accede a las credenciales del servicio DOX desde package.json
const cap_dox_key_uaa =
  (typeof process.env.cap_dox_key_uaa === 'undefined')
    ? cds.env.requires.cap_dox_key_uaa          // Accede a las credenciales desde .env si no están en el entorno de Fiori.
    : JSON.parse(process.env.cap_dox_key_uaa);  // Accede a las variables de entorno si está desplegado en Fiori.

/**
 * Prepara el cuerpo de la solicitud para enviar una imagen y opciones al servicio.
 * @param {string} imagen - La imagen en formato base64.
 * @param {Object} options - Opciones para el procesamiento de la imagen.
 * @param {string} auth_token - Token de autorización para la solicitud.
 * @returns {FormData} - Cuerpo preparado para la solicitud.
 */
async function set_job_body(imagen, options, auth_token) {
  let mydata = new FormData();

  // Obtiene el schemaId si se proporciona el nombre del esquema
  if (options.schemaName) {
    options.schemaId = await get_schema(options, auth_token); // Llamada a la función get_schema para obtener el schemaId.
    delete options.schemaName;
  }

  // Manejo de plantillas dependiendo de la configuración de options
  if (options.templateId === 'detect') {
    let candidateTemplateIds = options.candidateTemplateIds;
    options.candidateTemplateIds = [];

    // Obtiene las plantillas candidatas
    for (let item of candidateTemplateIds) {
      let templateId = await get_template(item, options, auth_token); // Obtiene los templateId correspondientes.
      options.candidateTemplateIds.push(templateId);
    }
  } else if (options.templateId) {
    options.templateId = await get_template(options.templateId, options, auth_token); // Obtiene el templateId si se proporciona.
  }

  // Convierte la imagen de base64 a un buffer y la inserta en el FormData.
  const imageBuffer = Buffer.from(imagen, 'base64');
  const readStream = new Readable();
  readStream.push(imageBuffer);
  readStream.push(null);

  // Agrega la imagen y las opciones al FormData
  mydata.append('file', readStream, {
    filename: 'image.jpg', // Nombre del archivo
    contentType: 'image/jpeg'
  });
  mydata.append('options', JSON.stringify(options));

  return mydata; // Devuelve el FormData completo.
}

/**
 * Prepara el cuerpo para el envío de ground truth (campos de encabezado y lineItems).
 * @param {Array} headerFields - Campos del encabezado.
 * @param {Array} lineItems - Elementos de línea.
 * @returns {string} - Cuerpo preparado para el envío de ground truth.
 */
async function set_groundtruth_body(headerFields, lineItems) {
  // Filtra headerFields eliminando duplicados por el campo ID.
  headerFields = headerFields.reduce((acc, item) => {
    if (!acc.seen.has(item.ID)) {
      acc.seen.add(item.ID);  // Agrega el ID al set para rastrear duplicados.
      acc.result.push(item);  // Si no se ha visto antes, se agrega al resultado.
    }
    return acc;
  }, { seen: new Set(), result: [] }).result;

  // Filtra lineItems eliminando duplicados por el campo ID.
  lineItems = lineItems.reduce((acc, item) => {
    if (!acc.seen.has(item.ID)) {
      acc.seen.add(item.ID);
      acc.result.push(item);
    }
    return acc;
  }, { seen: new Set(), result: [] }).result;
  
  let lineItems_obj = lineItems.reduce((acc, item) => {
    (acc[item.items_ID] ||= []).push({
      name: item.name,
      value: item._value,
      coordinates: {
        x: item.coor_x,
        y: item.coor_y,
        w: item.coor_w,
        h: item.coor_h
      }
    });
    return acc;
  }, {});

  // Mapear los headerFields para crear un objeto con los campos y sus coordenadas.
  headerFields = headerFields.map(item => ({
    name: item.name,
    value: item._value,
    coordinates: {
      x: item.coor_x,
      y: item.coor_y,
      w: item.coor_w,
      h: item.coor_h
    }
  }));

  lineItems = Object.values(lineItems_obj);

  // Crea el payload que será enviado con headerFields y lineItems.
  const payload = {
    languages: ['en', 'es'],
    country: 'PY',
    extraction: {
      headerFields: headerFields,
      lineItems: lineItems
    }
  };

  return JSON.stringify(payload); // Devuelve el payload en formato JSON.
}

/**
 * Obtiene un token de acceso utilizando las credenciales de cliente.
 * @returns {string} - Token de acceso.
 */
async function get_token() {
  var basic_auth = cap_dox_key_uaa.clientid + ':' + cap_dox_key_uaa.clientsecret; // Credenciales básicas para autenticación.
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: cap_dox_key_uaa.url + '/oauth/token?grant_type=client_credentials',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(basic_auth).toString('base64'),
      'Accept': 'application/json'
    }
  };

  let access_token = '';
  access_token = await axios.request(config)
    .then((response) => {
      console.log('Oauth Token Fetched');
      return response.data.access_token;
    })
    .catch((error) => {
      log(error); // [Advertencia] Falta mejorar el manejo de errores en la solicitud de token.
    });

  return 'Bearer ' + access_token; // Retorna el token con formato Bearer.
}

/**
 * Obtiene el ID del esquema correspondiente a las opciones proporcionadas.
 * @param {Object} options - Opciones que incluyen clientId y documentType.
 * @param {string} auth_token - Token de autorización.
 * @returns {string} - ID del esquema encontrado.
 */
async function get_schema(options, auth_token) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: cap_dox_key.endpoints.backend.url + cap_dox_key.swagger + 'schemas?clientId=' + options.clientId,
    headers: {
      'Authorization': auth_token,
      'Accept': 'application/json'
    }
  };

  let schemaId = '';
  schemaId = await axios.request(config)
    .then((response) => {
      // Busca el esquema correcto comparando el nombre y el tipo de documento
      for (let item of response.data.schemas) {
        if ((item.name === options.schemaName) && (item.documentType === options.documentType)) {
          return item.id;  // Retorna el schemaId que coincide con las opciones
        }
      }
    })
    .catch((error) => {
      console.log(error);  // [Advertencia] Manejo de errores en la solicitud del esquema
    });

  return schemaId; // Retorna el schemaId encontrado o vacío si falla
}

/**
 * Obtiene el ID de la plantilla a partir del nombre de la plantilla y las opciones.
 * @param {string} templateName - Nombre de la plantilla que se desea obtener.
 * @param {Object} options - Opciones que incluyen clientId y schemaId.
 * @param {string} auth_token - Token de autorización.
 * @returns {string} - ID de la plantilla encontrada.
 */
async function get_template(templateName, options, auth_token) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: cap_dox_key.endpoints.backend.url + cap_dox_key.swagger + 'templates?clientId=' + options.clientId + '&schemaId=' + options.schemaId,
    headers: {
      'Authorization': auth_token,
      'Accept': 'application/json'
    }
  };

  let templateId = '';
  templateId = await axios.request(config)
    .then((response) => {
      for (let item of response.data.results) {
        // Busca el ID de la plantilla que coincide con el nombre
        if (item.name === templateName) {
          return item.id;
        }
      }
    })
    .catch((error) => {
      console.log(error); // [Advertencia] Manejo de errores en la solicitud de plantilla
    });

  return templateId; // Retorna el templateId encontrado o vacío si falla
}

/**
 * Publica un trabajo en el servicio DOX con la imagen y opciones dadas.
 * @param {string} imagen - Imagen en formato base64.
 * @param {Object} options - Opciones para el procesamiento del trabajo.
 * @param {string} auth_token - Token de autorización.
 * @returns {string} - ID del trabajo creado.
 */
async function post_job(imagen, options, auth_token) {
  var job_data = await set_job_body(imagen, options, auth_token); // Prepara el cuerpo de la solicitud con la imagen y las opciones

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: cap_dox_key.endpoints.backend.url + cap_dox_key.swagger + 'document/jobs',
    headers: {
      'Authorization': auth_token,
      'Accept': 'application/json'
    },
    data: job_data // Envía los datos de trabajo a la API
  };

  let job_id = '';
  job_id = await axios.request(config)
    .then((response) => {
      console.log(`JOB Post ID: ' ${JSON.stringify(response.data.id)}`); // Registro del ID del trabajo creado
      return response.data.id; // Retorna el ID del trabajo creado
    })
    .catch((error) => {
      console.log(error.response.data.error); // [Advertencia] Manejo de errores al publicar el trabajo
    });

  return job_id; // Retorna el job_id o vacío si falla
}

/**
 * Publica ground truth para un trabajo en DOX usando headerFields y lineItems.
 * @param {Array} headerFields - Campos de encabezado.
 * @param {Array} lineItems - Elementos de línea.
 * @param {string} id - ID del trabajo.
 * @param {string} auth_token - Token de autorización.
 * @returns {Object} - Resultado del envío de ground truth.
 */
async function post_ground_truth(headerFields, lineItems, id, auth_token) {
  var ground_truth = await set_groundtruth_body(headerFields, lineItems); // Prepara el cuerpo con el ground truth

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${cap_dox_key.endpoints.backend.url}${cap_dox_key.swagger}document/jobs/${id}`,
    headers: {
      'Authorization': auth_token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    data: ground_truth // Envia el ground truth al API
  };

  let job_status = '';
  job_status = await axios.request(config)
    .then((response) => {
      return response.data; // Retorna la respuesta de la API
    })
    .catch((error) => {
      console.log(error.response.data.error); // [Advertencia] Manejo de errores al enviar ground truth
    });

  return job_status; // Retorna el estado del trabajo o vacío si falla
}

/**
 * Consulta el estado de un trabajo dado su ID.
 * @param {string} job_id - ID del trabajo a consultar.
 * @param {string} auth_token - Token de autorización.
 * @returns {Object} - Detalles del trabajo una vez completado.
 */
async function get_job_status(job_id, auth_token) {
  console.log("Waiting for result ...");
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: cap_dox_key.endpoints.backend.url + cap_dox_key.swagger + 'document/jobs/' + job_id,
    headers: { 'Authorization': auth_token }
  };

  let job_details;

  // Realiza consultas repetidas hasta que el trabajo ya no esté en estado "PENDING".
  do {
    job_details = await axios.request(config)
      .then((response) => {
        return response.data; // Retorna los detalles del trabajo
      })
      .catch((error) => {
        log(error); // [Advertencia] Manejo de errores en la consulta del estado del trabajo
      });
  } while (job_details.status === 'PENDING'); // Se detiene cuando el estado ya no es "PENDING"

  return job_details; // Retorna los detalles del trabajo cuando esté completo
}

/**
 * Genera un UUID único basado en un UUID inicial, manteniendo la parte inicial intacta.
 * @param {string} initialUuid - UUID inicial.
 * @returns {string} - Nuevo UUID generado.
 */
function randomId(initialUuid) {
  // Extrae la parte inicial del UUID
  const initialPart = initialUuid.substring(0, 24);
  const timestamp = Date.now().toString(10).substring(8, 12); // Obtiene un timestamp
  const randomPart = Math.floor(Math.random() * 0x100000000).toString(16); // Genera un número aleatorio en hexadecimal

  return `${initialPart}${timestamp}${randomPart}`; // Combina partes para generar un nuevo ID
}

// Exporta funciones para su uso en otros módulos
module.exports = {
  auth_token: async function () {
    return await get_token(); // Obtiene el token de autenticación
  },
  post_job: async function (pdf, fileName, auth_token) {
    return await post_job(pdf, fileName, auth_token); // Publica un nuevo trabajo con la imagen y opciones
  },
  get_job_status: async function (job_id, auth_token) {
    return await get_job_status(job_id, auth_token); // Consulta el estado del trabajo por su ID
  },
  post_ground_truth: async function (headerFields, lineItems, id, auth_token) {
    return await post_ground_truth(headerFields, lineItems, id, auth_token); // Publica ground truth de un trabajo
  },
  randomId: function (initialUuid) {
    return randomId(initialUuid); // Genera un UUID basado en el UUID inicial
  }
};
