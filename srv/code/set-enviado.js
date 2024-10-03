/**
 * 
 * @After(event = { "enviar" }, entity = "facturasbackendService.Datos")
 * @param {(Object|Object[])} results - For the After phase only: the results of the event processing
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* After the /enviar function set the state of both
 * Foto and Dato to enviado: true
*/
module.exports = async function(results, request) {
	const { Fotos, Datos } = cds.entities;
	const { ID, fotos_ID } = results

	await UPDATE.entity(Fotos).set({
		enviado : true
	}).where({
		ID : fotos_ID
	}).then(
		console.log("👍 set-foto.enviado(true)")
	)
	

	await UPDATE.entity(Datos).set({
		enviado : true
	}).where({
		ID : ID
	}).then(
		console.log("👍 set-dato.enviado(true)")
	)
	
}