/**
 * Maneja el evento After para el envío de registros en la entidad "Datos".
 * Este evento se activa después de que se ha procesado la función /enviar.
 *
 * @After(event = { "enviar" }, entity = "facturasbackendService.Datos")
 * @param {(Object|Object[])} results - Resultados del procesamiento del evento.
 * @param {Object} request - Información del usuario, modelo CDS específico del inquilino, encabezados y parámetros de consulta.
 */

const { set_groundtruth_body } = require('./lib_cap_dox'); // Importar librería para interacciones con DOX

/* Después de la función /enviar, establece el estado
 * de Foto y Dato a enviado: true.
 */
module.exports = async function (results, request) {
	const { Fotos, Items, Datos, Values } = cds.entities('facturasbackendService'); // Accede a las entidades Fotos, Items, Datos y Values.
	const foto_ID = request.params[0]; // Obtiene el ID de la foto a partir de los parámetros de la solicitud.
	const IDlist = results

	console.log(IDlist)

	try {
		// Actualiza el estado de la Foto a 'enviado'
		await UPDATE.entity(Fotos)
			.set({ enviado: true })
			.where({ ID: foto_ID })
		console.log("👍 set-foto.enviado(true)"); // Confirma la actualización del estado de la foto.


		// [Advertencia] Esta lógica podría no ser clara, ya que implica varios niveles de relaciones y subconsultas.
		// Actualiza el estado de Values relacionados a Datos que pertenecen a la Foto o a Items relacionados con la Foto.
		for (let id of IDlist) {
			await UPDATE.entity(Values)
				.set({ enviado: true })
				.where({ ID: id });
			console.log(id)
		}

		const foto = await SELECT.one.from(Fotos).columns('enviado').where({
			ID: foto_ID
		})

		return foto

	} catch (error) {
		// Manejo de errores en las operaciones de actualización.
		console.error("Error al actualizar 'enviados':")
		request.error(error);
	}
};

