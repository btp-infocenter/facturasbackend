const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const cds = require('@sap/cds');
const { Readable } = require('stream');
const { log } = require("console");
const cap_dox_key = cds.env.cap_dox_key;
const cap_dox_key_uaa = cds.env.requires.cap_dox_key_uaa;

/**
 * Prepara el cuerpo de la solicitud para enviar una imagen y opciones al servicio.
 * @param {string} imagen - La imagen en formato base64.
 * @param {Object} options - Opciones para el procesamiento de la imagen.
 * @param {string} auth_token - Token de autorización para la solicitud.
 * @returns {FormData} - Cuerpo preparado para la solicitud.
 */
async function setbody(imagen, options, auth_token) {
  let mydata = new FormData();

  // Obtiene el schemaId si se proporciona el nombre del esquema
  if (options.schemaName) {
    options.schemaId = await get_schema(options, auth_token);
    delete options.schemaName;
  }

  // Manejo de plantillas dependiendo de la configuración de options
  if (options.templateId === 'detect') {
    let candidateTemplateIds = options.candidateTemplateIds;
    options.candidateTemplateIds = [];
    
    // Obtiene las plantillas candidatas
    for (let item of candidateTemplateIds) {
      let templateId = await get_template(item, options, auth_token);
      options.candidateTemplateIds.push(templateId);
    }
  } else if (options.templateId) {
    options.templateId = await get_template(options.templateId, options, auth_token);
  }

  // Convierte la imagen de base64 a un buffer
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

  return mydata;
}

/**
 * Obtiene un token de acceso utilizando las credenciales de cliente.
 * @returns {string} - Token de acceso.
 */
async function get_token() {
  var basic_auth = cap_dox_key_uaa.clientid + ':' + cap_dox_key_uaa.clientsecret;
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
      log(error); // [Advertencia] Manejo de errores en la solicitud de token
    });
  
  return 'Bearer ' + access_token;
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
      for (let item of response.data.schemas) {
        // Compara el nombre y tipo de documento para encontrar el esquema correcto
        if ((item.name === options.schemaName) && (item.documentType === options.documentType)) {
          return item.id;
        }
      }
    })
    .catch((error) => {
      console.log(error); // [Advertencia] Manejo de errores en la solicitud del esquema
    });
  
  return schemaId;
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
  
  return templateId;
}

/**
 * Publica un trabajo en el servicio DOX con la imagen y opciones dadas.
 * @param {string} imagen - Imagen en formato base64.
 * @param {Object} options - Opciones para el procesamiento del trabajo.
 * @param {string} auth_token - Token de autorización.
 * @returns {string} - ID del trabajo creado.
 */
async function post_job(imagen, options, auth_token) {
  var job_data = await setbody(imagen, options, auth_token);

  // console.log(job_data); // [Advertencia] Registro del cuerpo del trabajo

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: cap_dox_key.endpoints.backend.url + cap_dox_key.swagger + 'document/jobs',
    headers: {
      'Authorization': auth_token,
      'Accept': 'application/json'
    },
    data: job_data
  };

  let job_id = '';
  job_id = await axios.request(config)
    .then((response) => {
      // console.log('JOB Post ID: ------------------>');
      // console.log(JSON.stringify(response.data.id)); // Registro del ID del trabajo creado
      return response.data.id;
    })
    .catch((error) => {
      console.log(error);
      console.log(error.response.data.error); // [Advertencia] Manejo de errores al publicar el trabajo
    });
  
  return job_id;
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

  do {
    job_details = await axios.request(config)
      .then((response) => {
        // log('JOB Status: --->', JSON.stringify(response.data.status));
        return response.data;
      })
      .catch((error) => {
        log(error); // [Advertencia] Manejo de errores en la consulta del estado del trabajo
      });

  } while (job_details.status === 'PENDING');

  return job_details; // Retorna los detalles del trabajo cuando esté completo
}

/**
 * Genera un objeto con los campos del encabezado a partir de los resultados de extracción.
 * @param {Object} headerInit - Datos iniciales del encabezado.
 * @param {Array} headerFields - Campos extraídos del encabezado.
 * @param {Array} headerFieldNames - Nombres de los campos a incluir.
 * @returns {Object} - Encabezado generado.
 */
async function headerFieldGen(headerInit, headerFields, headerFieldNames) {
  let myHeaderFields = { ...headerInit };

  for (let item of headerFields) {
    let name = item.name;
    if (headerFieldNames.includes(name)) {
      myHeaderFields[`${name}_value`] = String(item.value);
      myHeaderFields[`${name}_confidence`] = item.confidence;
      myHeaderFields[`${name}_coordinates_x`] = item.coordinates.x;
      myHeaderFields[`${name}_coordinates_y`] = item.coordinates.y;
      myHeaderFields[`${name}_coordinates_w`] = item.coordinates.w;
      myHeaderFields[`${name}_coordinates_h`] = item.coordinates.h;
    }
  }

  return myHeaderFields; // Retorna el encabezado generado
}

/**
 * Genera objetos de línea de ítems a partir de los resultados de extracción.
 * @param {Object} itemsInit - Datos iniciales de los ítems.
 * @param {Array} itemsFields - Campos extraídos de los ítems.
 * @param {Array} itemsFieldNames - Nombres de los campos a incluir.
 * @returns {Array} - Lista de ítems generados.
 */
async function itemsFieldGen(itemsInit, itemsFields, itemsFieldNames) {
  let myLineItems = [];

  for (let lineItem of itemsFields) {
    let myLineFields = { ...itemsInit };
    myLineFields.ID = randomId(myLineFields.datosHeader_ID); // Genera un ID único para el ítem
    
    for (let item of lineItem) {
      let name = item.name;

      if (itemsFieldNames.includes(name)) {
        myLineFields[`${name}_value`] = String(item.value);
        myLineFields[`${name}_confidence`] = item.confidence;
        myLineFields[`${name}_coordinates_x`] = item.coordinates.x;
        myLineFields[`${name}_coordinates_y`] = item.coordinates.y;
        myLineFields[`${name}_coordinates_w`] = item.coordinates.w;
        myLineFields[`${name}_coordinates_h`] = item.coordinates.h;
      }
    }
    myLineItems.push(myLineFields); // Agrega el ítem generado a la lista
  }

  return myLineItems; // Retorna la lista de ítems generados
}

/* Código de GEMINI. Generar un UUID único,
  de forma tal que la primera parte sea igual que la
  Foto a la que hace referencia */
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
    return await get_token();
  },
  schema_id: async function () {
    return await get_schema();
  },
  post_job: async function (pdf, fileName, auth_token) {
    return await post_job(pdf, fileName, auth_token);
  },
  get_job_status: async function (job_id, auth_token) {
    return await get_job_status(job_id, auth_token);
  },
  headerFieldGen: async function (headerInit, headerFields, headerFieldNames) {
    return await headerFieldGen(headerInit, headerFields, headerFieldNames);
  },
  itemsFieldGen: async function (itemsInit, itemsFields, itemsFieldNames) {
    return await itemsFieldGen(itemsInit, itemsFields, itemsFieldNames);
  },
  randomId: function (initialUUID) {
    return randomId(initialUUID);
  }
};
