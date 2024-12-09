/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const projectId = '246598648921';
const location = 'us'; // Format is 'us' or 'eu'
const processorId = '4646dfa084665f57:process'; // Create processor in Cloud Console

const { DocumentProcessorServiceClient } =
    require('@google-cloud/documentai').v1;

// Instantiates a client
// apiEndpoint regions available: eu-documentai.googleapis.com, us-documentai.googleapis.com (Required if using eu based processor)
// const client = new DocumentProcessorServiceClient({apiEndpoint: 'eu-documentai.googleapis.com'});
const client = new DocumentProcessorServiceClient();

async function quickstart(base64, mimeType) {
    const { Storage } = require('@google-cloud/storage');

    async function authenticateImplicitWithAdc() {
        // This snippet demonstrates how to list buckets.
        // NOTE: Replace the client created below with the client required for your application.
        // Note that the credentials are not specified when constructing the client.
        // The client library finds your credentials using ADC.
        const storage = new Storage({
            projectId,
        });
        const [buckets] = await storage.getBuckets();
        console.log('Buckets:');

        for (const bucket of buckets) {
            console.log(`- ${bucket.name}`);
        }

        console.log('Listed all storage buckets.');
    }

    authenticateImplicitWithAdc();



    // The full resource name of the processor, e.g.:
    // projects/project-id/locations/location/processor/processor-id
    // You must create new processors in the Cloud Console first
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    const request = {
        name,
        rawDocument: {
            content: base64,
            mimeType: `application/${mimeType}`,
        },
    };

    // Recognizes text entities in the PDF document
    const [result] = await client.processDocument(request);
    const { document } = result;

    // Get all of the document text as one big string
    const { text } = document;

    // Extract shards from the text field
    const getText = textAnchor => {
        if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
            return '';
        }

        // First shard in document doesn't have startIndex property
        const startIndex = textAnchor.textSegments[0].startIndex || 0;
        const endIndex = textAnchor.textSegments[0].endIndex;

        return text.substring(startIndex, endIndex);
    };

    // Read the text recognition output from the processor
    console.log('The document contains the following paragraphs:');
    const [page1] = document.pages;
    const { paragraphs } = page1;

    for (const paragraph of paragraphs) {
        const paragraphText = getText(paragraph.layout.textAnchor);
        console.log(`Paragraph text:\n${paragraphText}`);
    }
}

module.exports = {
    quickstart: async function (base64, mimeType) {
        return await quickstart(base64, mimeType); // Obtiene el token de autenticación
    }
}