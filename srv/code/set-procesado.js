/**
 * 
 * @After(event = { "CREATE" }, entity = "facturasbackendService.Fotos")
 * @param {(Object|Object[])} results - For the After phase only: the results of the event processing
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function(results, request) {
	const { Fotos } = cds.entities
	const {ID} = results;

	// Setear estado como 'Procesado'
	await UPDATE.entity(Fotos).set({
		"procesado": true
	}).where({
		"ID": ID
	}).then(
		console.log("👍 set-procesado(true)")
	);
}