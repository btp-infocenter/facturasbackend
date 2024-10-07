/**
 * Maneja el evento After para la creación de registros en la entidad "Datos".
 * Este evento se activa después de que se ha procesado un evento CREATE.
 *
 * @After(event = { "CREATE" }, entity = "facturasbackendService.Datos")
 * @param {(Object|Object[])} results - Resultados del procesamiento del evento.
 * @param {Object} request - Información del usuario, modelo CDS específico del inquilino, encabezados y parámetros de consulta.
 */

/* Si nuevos datos son provistos para una foto,
 * el estado de la foto pasa a ser 'no enviado'.
 */
module.exports = async function(results, request) {
	const { Fotos } = cds.entities; // Accede a la entidad Fotos.
	const { fotos_ID } = results; // Extrae el ID de las fotos del resultado del evento.

	await UPDATE.entity(Fotos) // Inicia una operación de actualización en la entidad Fotos.
		.set({ 
			enviado: false // Establece el estado de enviado a falso.
		})
		.where({ 
			ID: fotos_ID, // Condición: ID de fotos que coincide con fotos_ID.
			enviado: true // Solo actualiza si el estado actual es 'enviado'.
		})
		.then(() => {
			console.log("👍 reset-foto.enviado(false)"); // Confirma que el estado se ha actualizado.
		})
		.catch(error => {
			console.error("Error al actualizar estado de enviado:", error); // Manejo de errores en la operación de actualización.
		});
};
