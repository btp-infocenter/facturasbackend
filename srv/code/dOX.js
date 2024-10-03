/**
 * 
 * @On(event = { "dox" }, entity = "uploadPhoto.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

/* Código de GEMINI. Generar un UUID único,
	de forma tal que la primea parte sea igual que la
	Foto a la que hace referencia */
function randomId(initialUuid) {
	// Extract the initial UUID part
	const initialPart = initialUuid.substring(0, 24);
	const timestamp = Date.now().toString(10).substring(8, 12);
	const randomPart = Math.floor(Math.random() * 0x100000000).toString(16);

	return `${initialPart}${timestamp}${randomPart}`;
}

/* Al crear una nueva foto automáticamente se manda a procesar
	al Document Information Extraction */
module.exports = async function (request) {
	const { Fotos, Datos } = cds.entities;
	const fotos_ID = request.params[0]

	const foto = await SELECT.one
		.columns('procesado')
		.from(Fotos) 
		.where({
			ID: fotos_ID
		})
	
	if (foto.procesado) request.error('Esta Foto ya fue procesada anteriormente')

	// Agregar el ID de los Datos, y referenciar a la Foto
	const dato = await INSERT.into(Datos).entries({
		"ID": randomId(fotos_ID),
		"fotos_ID": fotos_ID,
		"autoCreado": true
	}).then(
		console.log("👍 Creado-datosAutoGenerados")
	);

	// Set foto como 'procesado'
	await UPDATE.entity(Fotos).set({
		"procesado" : true
	}).where({
		"ID": fotos_ID
	}).then(
		console.log("👍 Foto procesada")
	);
}