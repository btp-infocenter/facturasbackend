/**
 * 
 * @On(event = { "update_datos" }, entity = "service.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const { auth_token, post_ground_truth } = require('./lib_cap_dox');

module.exports = async function (request) {
	const { Fotos } = cds.entities('facturasminibackend');
	const foto_ID = request.params[0];

	const headerFields = request.data.headerFields.map(item => JSON.parse(item))
	const lineItems = request.data.lineItems.map(item => JSON.parse(item))

	const { doxID } = await SELECT.one
		.from(Fotos)
		.columns('doxID')
		.where({
			ID: foto_ID
		})

	const token = await auth_token()

	const dox = await post_ground_truth(headerFields, lineItems, doxID, token)

	const modifiedAt = new Date()

	await UPDATE.entity(Fotos)
		.data({
			modifiedAt
		})
		.where({
			ID: foto_ID
		})

	return { dox, modifiedAt }
}