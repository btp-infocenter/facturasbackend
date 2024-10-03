/**
 * 
 * @Before(event = { "enviar" }, entity = "facturasbackendService.Datos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* Verificar que el Dato no haya sido enviado
 * anteriormente.
 * Restricción aplicada para /enviar un Dato.
*/
module.exports = async function(request) {
	const { Datos } = cds.entities;
	const dato_ID = request.params[0];

	const dato = await SELECT.one
			.columns('enviado')
			.from(Datos)
			.where({
				ID: dato_ID
			});

	if (dato.enviado)
		request.error('Los datos enviados no se pueden modificar');
	else
		console.log("👍 Check-enviado")	
}