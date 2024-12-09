/**
 * 
 * @On(event = { "DOX" }, entity = "service.Foto")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const { post_job, auth_token } = require('./lib_cap_dox')
const { quickstart } = require('./documentai')

module.exports = async function (request) {
	const { Fotos } = cds.entities('facturasminibackend');
	const foto_ID = request.params[0];

	console.log('Starting extraction ...');

	const { imagen, mimetype } = await SELECT.one
		.from(Fotos)
		.columns(['imagen', 'mimetype'])
		.where({ ID: foto_ID })

	const options = {
		"clientId": "default",
		"documentType": "invoice",
		"schemaName": "facturasCajaChicaS4Esquema4",
		"templateId": "detect"
	};

	const title = typeof process.env.cap_dox_key_uaa === 'undefined' ?
		`${new Date().toLocaleTimeString("es-US", { hour12: false, timeZone: "America/Asuncion" })} [test]` :
		`${new Date().toLocaleTimeString("es-US", { hour12: false, timeZone: "America/Asuncion" })}`

	await quickstart(imagen, mimetype)
}