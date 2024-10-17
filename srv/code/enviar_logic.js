/**
 * 
 * @On(event = { "enviar" }, entity = "facturasbackendService.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const cap_doxlib = require('./lib_cap_dox'); // Importar librería para interacciones con DOX

module.exports = async function (request) {
	const { Fotos, Datos, Values, Items } = cds.entities('facturasbackend'); // Accede a las entidades Fotos, Datos, Values, y Items del servicio 'facturasbackend'.
	const foto_ID = request.params[0]; // Obtiene el parámetro 'foto_ID' de la solicitud.

	try {
		// Selecciona el doxID de la entidad Fotos para la foto correspondiente al foto_ID.
		const { doxID } = await SELECT.one
			.from(Fotos)
			.columns('doxID')
			.where({
				ID: foto_ID
			});

		// Selecciona los campos principales (headerFields) de la entidad Datos, asociando los valores y las coordenadas.
		const headerFields = await SELECT
			.from(Datos)
			.columns(
				'ID',
				'name',
				'value.value as _value', // Alias a '_value' para evitar colisión de nombres.
				'coordinates_x as coor_x',
				'coordinates_y as coor_y',
				'coordinates_h as coor_h',
				'coordinates_w as coor_w'
			)
			.where({
				fotos_ID: foto_ID // Filtra por el ID de la foto.
			})
			.orderBy({ 'value.createdAt': 'desc' }); // Ordena por la fecha de creación del valor, de manera descendente.

		// Selecciona los items correspondientes desde la entidad Datos, donde items_ID está en la subconsulta de Items.
		const lineItems = await SELECT
			.from(Datos)
			.columns(
				'ID',
				'name',
				'items_ID',
				'value.value as _value', // Alias a '_value' para valores de items.
				'coordinates_x as coor_x',
				'coordinates_y as coor_y',
				'coordinates_h as coor_h',
				'coordinates_w as coor_w'
			)
			.where({
				items_ID: {
					in: SELECT.from(Items).columns('ID').where({
						fotos_ID: foto_ID // Filtra por los items que corresponden al foto_ID.
					})
				}
			})
			.orderBy({
				'value.createdAt': 'desc',
			});

		// [Advertencia] El proceso de autenticación parece depender de una librería externa 'cap_doxlib', que no se encuentra definida en este código. 
		const auth_token = await cap_doxlib.auth_token(); // Obtiene el token de autenticación para DOX.

		// Envía los campos de encabezado y de línea a DOX usando la función post_ground_truth.
		const res = await cap_doxlib.post_ground_truth(headerFields, lineItems, doxID, auth_token);

		// Verifica si la respuesta de la función post_ground_truth fue exitosa.
		if (!res)
			request.error("Error al enviar ground truth a DOX:");

		return res;

	} catch (error) {
		// Maneja errores ocurridos durante el proceso de actualización y los envía en la respuesta.
		request.error("Error al actualizar estados de enviado:", error);
	}
}
