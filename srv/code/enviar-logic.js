/**
 * 
 * @On(event = { "enviar" }, entity = "facturasbackendService.Datos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (request, next) {
	const { Datos } = cds.entities;
	const dato_ID = request.params[0];

	dato = await SELECT.one
		.from(Datos)
		.where({
			ID: dato_ID
		});

	return dato;
	// request.error('raise error');
}