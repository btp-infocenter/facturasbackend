/**
 * 
 * @On(event = { "datos" }, entity = "service.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const { isExternalEntity } = require('@sap/low-code-event-handler/src/external/ExternalServiceHandler');
const { get_job, auth_token } = require('./lib_cap_dox');

module.exports = async function (request) {
	const { Fotos } = cds.entities('facturasminibackend');
	const foto_ID = request.params[0];

	const { doxID } = await SELECT.one
		.from(Fotos)
		.where({ ID: foto_ID });


	if (!doxID) {
		request.error('Imagen no procesada')
		return (500)
	}

	const token = await auth_token();

	console.log('[200]', doxID, '[201]')

	const res = await get_job(doxID, token);

	// console.log('[700]', res.GT.extraction , '[701]')

	if (res.AI.status == 'ERROR') {
		request.error('Imagen no procesable')
		return (500)
	}

	let datos = Object.fromEntries(
		res.AI.extraction.headerFields.map((item) => [
			item.name,
			{
				value: item.value == null ? null : item.value.toString(),
				coordinates: item.coordinates,
				confidence: item.confidence,
				label: item.label,
				type: item.type,
				valorAI: null
			},
		])
	)

	for (let field of res.GT.extraction.headerFields) {
		datos[field.name].valorAI = field.value.toString()
	}

	let lines = []

	for (let i in res.AI.extraction.lineItems) {
		let newline = Object.fromEntries(
			res.AI.extraction.lineItems[i].map((item) => [
				item.name,
				{
					value: item.value == null ? null : item.value.toString(),
					coordinates: item.coordinates,
					confidence: item.confidence,
					label: item.label,
					type: item.type,
					valorAI: null
				},
			])
		)

		for (let field of res.GT.extraction.lineItems[i]) {
			newline[field.name].valorAI = field.value.toString()
		}

		lines.push(newline)
	}


	datos['lineItems'] = lines

	datos['foto_ID'] = foto_ID

	return (datos)
}