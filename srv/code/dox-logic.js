/**
 * 
 * @On(event = { "DOX" }, entity = "service.Foto")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const { post_job, auth_token } = require('./lib_cap_dox')

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

	const token = await auth_token();

	const img = {
		base64: imagen,
		title: title,
		mimetype: mimetype
	}

	let job_id = await post_job(img, options, token);

	console.log(`DOX id >>> ${job_id} <<<`);

	if (job_id.error) {
		request.error(job_id.error)
		return
	}

	const modifiedAt = new Date()

	await UPDATE.entity(Fotos)
		.data({
			doxID: job_id,
			modifiedAt
		})
		.where({ ID: foto_ID })

	return { job_id, modifiedAt };
}