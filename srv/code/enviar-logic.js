/**
 * 
 * @On(event = { "enviar" }, entity = "service.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const { post_factura, testing } = require('./lib_cap_s4');
const cap_doxlib = require('./lib_cap_dox');

module.exports = async function(request) {
	const { Fotos } = cds.entities('facturasminibackend');
	const foto_ID = request.params[0];

	await testing()
}