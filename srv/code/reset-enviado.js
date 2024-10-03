/**
 * 
 * @After(event = { "CREATE" }, entity = "facturasbackendService.Datos")
 * @param {(Object|Object[])} results - For the After phase only: the results of the event processing
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* Si nuevos datos son proveidos para una foto
 * el estado de la foto pasa a ser 'no enviado
*/
module.exports = async function(results, request) {
	const { Fotos } = cds.entities;
	const {fotos_ID} = results;

	await UPDATE.entity(Fotos).set({
		enviado : false
	}).where({
		ID: fotos_ID,
		enviado : true
	}).then(
		console.log("👍 reset-foto.enviado(false)")
	)
}