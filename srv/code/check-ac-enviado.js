const cds = require("@sap/cds-sqlite/lib/cds")

/**
 * 
 * @On(event = { "DELETE","UPDATE" }, entity = "facturasbackendService.Datos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* Verificar que el Dato no sea AutoGenerado y 
 * que no se haya enviado.
 * Restricción aplicada para EDITAR o ELIMINAR
 * un Dato.
*/
module.exports = async function(request) {
	const { Datos } = cds.entities;
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const ID = request.params[0];

	if (!uuidRegex.test(ID))
		request.error('El parametro no es UUID');

	// Obtener Dato y Foto asosciada
	const dato = await SELECT.one
		.columns('autoCreado', 'enviado')
		.from(Datos)
		.where({
			ID: ID
		});
	
	if (dato.autoCreado)
		request.error('Los datos extraidos automáticamente no se pueden modificar');
	else
		console.log("👍 Check-autoGenerado")

	if (dato.enviado)
		request.error('Los datos enviados no se pueden modificar');
	else
		console.log("👍 Check-enviado")
}