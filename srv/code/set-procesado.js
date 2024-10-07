/**
 * Maneja el evento After para el procesamiento de fotos en la entidad "uploadPhoto.Fotos".
 * Este evento se activa después de que se ha procesado una foto por DOX.
 *
 * @After(event = { "dox" }, entity = "uploadPhoto.Fotos")
 * @param {(Object|Object[])} results - Resultados del procesamiento del evento.
 * @param {Object} request - Información del usuario, modelo CDS específico del inquilino, encabezados y parámetros de consulta.
 */
module.exports = async function(results, request) {
	const { Fotos } = cds.entities('facturasbackendService');
	const ID = request.params[0];

	console.log("Inicio del procesamiento para la foto con ID:", ID); // Mejor mensaje de log

	try {
		// Actualizar el estado de la foto a 'procesado'
		await UPDATE.entity(Fotos).set({
			procesado: true
		}).where({
			ID: ID
		});
		
		console.log("👍 set-procesado(true)"); // Confirmación de la actualización

	} catch (error) {
		console.error("Error al actualizar el estado de la foto:", error); // Manejo de errores
	}
};
