/**
 * 
 * @On(event = { "upload" }, entity = "uploadPhoto.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* La imagen se recibe en lotes, así que cada string recibido en /upload se debe 
 * ir agregando a lo anterior
*/

module.exports = async function(request) {
	const { Fotos } = cds.entities;
	const newImagen = request.req.body.imagen;
	const fotos_ID = request.params[0]

	// Guardar imagen ya existente
	const oldFoto = await SELECT.one
		.columns('imagen')
		.from(Fotos)
		.where({
			ID: fotos_ID
		});

	// No agregar información encima de valor nulo
	const imagen = oldFoto.imagen == null ? newImagen : oldFoto.imagen + newImagen;
	
	// Actualizar imagen
	const newFoto = await UPDATE
		.entity(Fotos).set({
			imagen: imagen
		}).where({
			ID: fotos_ID
		}).then(
			console.log("👍 photo-uploaded")
		);
}