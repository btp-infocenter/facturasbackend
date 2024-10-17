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
module.exports = async function (results, request) {
	const { Fotos, Items, Datos, Values } = cds.entities('facturasbackendService'); // Accede a las entidades Fotos, Items, Datos y Values.
	const foto_ID = request.params[0]; // Obtiene el ID de la foto a partir de los parámetros de la solicitud.

	try {
		// Actualiza el estado de la Foto a 'enviado'
		await UPDATE.entity(Fotos).set({
			enviado: true
		}).where({
			ID: foto_ID
		})
		console.log("👍 set-foto.enviado(true)"); // Confirma la actualización del estado de la foto.

		// [Advertencia] Esta lógica podría no ser clara, ya que implica varios niveles de relaciones y subconsultas.
		// Actualiza el estado de Values relacionados a Datos que pertenecen a la Foto o a Items relacionados con la Foto.
		await UPDATE.entity(Values)
			.set({ enviado: true })
			.where({
				datos_ID: {
					in: SELECT.from(Datos)
						.columns('ID')
						.where(
							{ fotos_ID: foto_ID }) // Relaciona Datos con la Foto
						.or({
							items_ID: {
								in: SELECT.from(Items).columns('ID').where({
									fotos_ID: foto_ID // Relaciona Items con la Foto
								})
							}
						})
				}
			});

	} catch (error) {
		// Manejo de errores en las operaciones de actualización.
		console.error("Error al actualizar estados de enviado:", error);
	}
};

