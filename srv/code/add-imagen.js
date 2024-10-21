/**
 * 
 * @On(event = { "upload" }, entity = "uploadPhoto.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* La imagen se recibe en lotes, así que cada string recibido en /upload se debe 
 * ir agregando a lo anterior
*/

module.exports = async function(request) {
	const { Fotos } = cds.entities('uploadPhoto'); // Obtiene la entidad Fotos del modelo CDS
	const newImagen = request.req.body.imagen; // Captura la nueva imagen del cuerpo de la solicitud
	const fotos_ID = request.params[0]; // Obtiene el ID de la foto desde los parámetros de la solicitud

	// Guardar imagen ya existente
	const oldFoto = await SELECT.one
		.columns('imagen')
		.from(Fotos)
		.where({ID: fotos_ID});

	// No agregar información encima de valor nulo
	const imagen = oldFoto.imagen == null ? newImagen : oldFoto.imagen + newImagen; 
	// Si no hay imagen existente, utiliza la nueva; de lo contrario, concatena ambas

	// Actualizar imagen
	const newFoto = await UPDATE
		.entity(Fotos).set({
			imagen: imagen // Actualiza la imagen en la entidad Fotos
		}).where({
			ID: fotos_ID // Condición para actualizar la foto correcta
		}).then(
			console.log("👍 photo-uploaded") // Mensaje de éxito al subir la foto
		);
}
