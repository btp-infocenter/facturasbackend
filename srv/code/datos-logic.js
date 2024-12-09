/**
 * 
 * @On(event = { "datos" }, entity = "service.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const { parse2Apps } = require('./parser');

module.exports = async function (request) {
	const foto_ID = request.params[0];

	const op = parse2Apps(foto_ID)

	if (op.error)
		request.error(op.error)

	return op	
}