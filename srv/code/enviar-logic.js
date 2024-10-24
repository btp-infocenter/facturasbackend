/**
 * Manejador de eventos @On para el evento 'enviar' en la entidad 'Datos' del servicio 'facturasbackendService'.
 * Recupera los datos del encabezado (DatosHeader) asociados a un dato específico antes de enviar.
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

module.exports = async function (request, next) {
	const { DatosHeader } = cds.entities; // Acceso a la entidad DatosHeader
	const dato_ID = request.params[0]; // Obtener el ID del dato desde los parámetros

	// Recuperar el encabezado del dato basado en su ID
	const dato = await SELECT.one
		.from(DatosHeader)
		.where({
			ID: dato_ID
		});

	return dato; // Retornar los datos recuperados

	// request.error('raise error'); // Llamar a error si fuese necesario
};
