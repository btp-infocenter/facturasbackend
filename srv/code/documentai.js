const projectId = "246598648921";
const location = "us";
const processorId = "4646dfa084665f57";

const { DocumentProcessorServiceClient } =
  require("@google-cloud/documentai").v1beta3;

const { DocumentServiceClient } = require("@google-cloud/documentai").v1beta3;

const client = new DocumentProcessorServiceClient({
  apiEndpoint: "us-documentai.googleapis.com",
});

const documentaiClient = new DocumentServiceClient();

async function process_docai(base64, mimeType) {
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const request = {
    name,
    rawDocument: {
      content: base64,
      mimeType: `image/${mimeType}`,
    },
    fieldMask: ['cdc'],
  };

  const result = await client.processDocument(request);

  return result[0].document.entities;
}

async function get_schema() {
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}/dataset/datasetSchema`;

  const request = {
    name,
    visibleFieldsOnly: true
  };

  const response = await documentaiClient.getDatasetSchema(request);

  const header = response[0].documentSchema.entityTypes[0].properties.map(item => item.name)
  const items = response[0].documentSchema.entityTypes[1].properties.map(item => item.name)

  return { header, items }
}

module.exports = {
  process_docai: async function (base64, mimeType) {
    return await process_docai(base64, mimeType); // Obtiene el token de autenticación
  },
  get_schema: async function () {
    return await get_schema();
  },
};
