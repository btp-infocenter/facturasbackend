/**
 * 
 * @On(event = { "upload" }, entity = "service.Photos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (request) {
	const { Photos } = cds.entities('facturasminibackend');
	const newImagen = request.data.imagen;
	const fotos_ID = request.params[0];

	try {
		// Guardar imagen ya existente
		const oldFoto = await SELECT.one
			.columns('imagen')
			.from(Photos)
			.where({ ID: fotos_ID });

		// No agregar información encima de valor nulo
		const imagen = oldFoto.imagen == null ? newImagen : oldFoto.imagen + newImagen;
		// Si no hay imagen existente, utiliza la nueva; de lo contrario, concatena ambas

		// Actualizar imagen
		await UPDATE
			.entity(Photos).set({
				imagen: imagen // Actualiza la imagen en la entidad Photos
			}).where({
				ID: fotos_ID // Condición para actualizar la foto correcta
			}).then(
				console.log("👍 photo-uploaded") // Mensaje de éxito al subir la foto
			);

		return "👍 photo-uploaded";

	} catch (error) {
		request.error(error)
	}
}