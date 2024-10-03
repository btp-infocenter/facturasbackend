/**
 * 
 * @Before(event = { "CREATE","READ","UPDATE","DELETE" }, entity = "facturasbackendService.Datos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* Verificar que la Foto asociada al Dato:
 * 1. Ya fue procesada por DOX
 */
module.exports = async function(request) {
	const { Fotos, Datos } = cds.entities;
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const datos_ID = request.params[0];
	const method = Object.keys(request.query)[0];
	let fotos_ID;

	if (method == 'INSERT') {
		fotos_ID = request.req.body.fotos_ID

	} else {
		if (!uuidRegex.test(datos_ID)) {
			request.error('El parametro no es UUID'); 
			return;
		}

		const dato = await SELECT.one
			.columns('fotos_ID')
			.from(Datos)
			.where({
				ID : datos_ID
			})
		fotos_ID = dato.fotos_ID;
	}
	
	const foto = await SELECT.one
		.columns('procesado')
		.from(Fotos)
		.where({
			ID : fotos_ID
		})

	if (!foto.procesado)
		request.error("Espere a que la foto sea procesada");
	else
		console.log("👍 Check-procesado")	

}