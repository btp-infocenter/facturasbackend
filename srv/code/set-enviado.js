/**
 * Maneja el evento After para el envío de registros en la entidad "Datos".
 * Este evento se activa después de que se ha procesado la función /enviar.
 *
 * @After(event = { "enviar" }, entity = "facturasbackendService.Datos")
 * @param {(Object|Object[])} results - Resultados del procesamiento del evento.
 * @param {Object} request - Información del usuario, modelo CDS específico del inquilino, encabezados y parámetros de consulta.
 */

/* Después de la función /enviar, establece el estado
 * de Foto y Dato a enviado: true.
 */
module.exports = async function(results, request) {
	const { Fotos, DatosHeader } = cds.entities; // Accede a las entidades Fotos y DatosHeader.
	const { ID, fotos_ID } = results; // Extrae el ID del Dato y el ID de la Foto.

	try {
		// Actualiza el estado de la Foto a 'enviado'
		await UPDATE.entity(Fotos).set({ 
			enviado: true 
		}).where({
			ID: fotos_ID
		});
		console.log("👍 set-foto.enviado(true)"); // Confirma la actualización de la Foto.



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// CÓDIGO INCOMPLETO ///////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



		// Actualiza el estado del Dato a 'enviado'
		await UPDATE.entity(DatosHeader).set({
			enviado: true 
		}).where({
			ID: ID
		});
		console.log("👍 set-dato.enviado(true)"); // Confirma la actualización del Dato.

	} catch (error) {
		console.error("Error al actualizar estados de enviado:", error); // Manejo de errores en las operaciones de actualización.
	}
};
