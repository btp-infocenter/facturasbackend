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
module.exports = async function (results, request) {
	const { Values, Datos, Items, Fotos } = cds.entities('facturasbackendService'); // Accede a la entidad Fotos
	const { datos_ID } = results; // Extrae el ID de las fotos del resultado del evento

	try {
		// Obtiene fotos_ID y items_ID basado en datos_ID
		const dato = await SELECT.one
			.columns('fotos_ID', 'items_ID')
			.from(Datos)
			.where({ ID: datos_ID });

		// Obtiene fotos_ID de Items si existe items_ID
		const fotos_ID = dato.items_ID
			? (await SELECT.one
				.columns('fotos_ID')
				.from(Items)
				.where({ ID: dato.items_ID })).fotos_ID
			: dato.fotos_ID; // Usa fotos_ID de Datos si no hay items_ID

		// Actualiza el estado enviado de la entidad Fotos
		const updateResult = await UPDATE.entity(Fotos)
			.set({ enviado: false })
			.where({ ID: fotos_ID, enviado: true });

		if (updateResult) {
			console.log("👍 reset-foto.enviado(false)"); // Confirma la actualización del estado
		} else {
			console.warn("No se actualizaron filas. Verifica el estado actual.");
		}
	} catch (error) {
		console.error("Error al procesar la actualización:", error); // Manejo de errores
	}


};
