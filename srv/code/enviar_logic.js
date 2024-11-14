/**
 * 
 * @On(event = { "enviar" }, entity = "facturasbackendService.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const cap_doxlib = require('./lib_cap_dox'); // Importar librería para interacciones con DOX
const { post_factura } = require('./lib_cap_s4');

module.exports = async function (request) {
	const { Fotos, Datos, Values, Items } = cds.entities('facturasbackend'); // Accede a las entidades Fotos, Datos, Values, y Items del servicio 'facturasbackend'.
	const foto_ID = request.params[0]; // Obtiene el parámetro 'foto_ID' de la solicitud.

	try {
		// Selecciona el doxID de la entidad Fotos para la foto correspondiente al foto_ID.
		const { doxID } = await SELECT.one
			.from(Fotos)
			.columns('doxID')
			.where({ ID: foto_ID });

		// Selecciona los campos principales (headerFields) de la entidad Datos, asociando los valores y las coordenadas.
		const headerFields = await SELECT
			.from(Datos)
			.where({ and: { fotos_ID: foto_ID, 'value.value': { '!=': null } } })
			.columns(
				'ID',
				'name',
				'value.value as _value', // Alias a '_value' para evitar colisión de nombres.
				'value.ID as value_ID',
				'coordinates_x as coor_x',
				'coordinates_y as coor_y',
				'coordinates_h as coor_h',
				'coordinates_w as coor_w'
			)
			.orderBy({ 'value.createdAt': 'asc' }) // Ordena por la fecha de creación del valor, de manera descendente.

		// Selecciona los items correspondientes desde la entidad Datos, donde items_ID está en la subconsulta de Items.
		const lineItems = await SELECT
			.from(Datos)
			.columns(
				'ID',
				'name',
				'items_ID',
				'value.value as _value', // Alias a '_value' para valores de items.
				'value.ID as value_ID',
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
				'value.createdAt': 'asc',
			});

		var valuesHF = headerFields.filter(item => item._value != null)
			.reduce((acc, item) => {
				acc[item.name] = item._value;
				return acc;
			}, {});

		var valuesLI = lineItems.filter(item => item._value != null)
			.sort((a, b) => a.items_ID.localeCompare(b.items_ID))
			.reduce((acc, item) => {
				const { items_ID, name, _value } = item;

				// Find the group for the current items_ID, or create a new one if it doesn't exist
				let group = acc.find(g => g.items_ID === items_ID);
				if (!group) {
					group = { items_ID, values: {} };
					acc.push(group);
				}

				// Add the name-value pair to the current group's values object
				group.values[name] = _value;

				return acc;
			}, []);

		const data = {
			fechaFactura: "2024-11-12",
			nroFactura: valuesHF.nroFactura,
			creadoPor: "Bruno Bordon",
			timbrado: valuesHF.timbrado,
			ruc: "1548979-6",
			nombre: valuesHF.nombre,
			direccion: valuesHF.direccion,
			ciudad: valuesHF.ciudad,
			telefono: valuesHF.telefono,
			nroRendicion: "123456",
			concepto: "Prueba DOX + BAS",
			condVenta: valuesHF.condVenta,
			totalFactura: valuesHF.totalFactura,
			totalIva5: valuesHF.totalIva5,
			totalIva10: valuesHF.totalIva10,
			moneda: 'PYG',
			lineItems: valuesLI.map(item => item.values)
		}

		console.log('Enviando a S4 ...')

		const r = await post_factura(data)

		if (r.error != undefined) {
			console.log("Error al crear registro en S4:")
			request.error(JSON.stringify(r.error.map(item => item.message)));
			return({error: JSON.stringify(r.error.map(item => item.message))})
		}

		console.log("👍 Enviado a S4")
		console.log(`Document Number: ${r.split(" ").at(-2).slice(0, -8)}`)
		console.log(`Company Code:    ${r.split(" ").at(-2).slice(-8, -4)}`)
		console.log(`Fiscar Year:     ${r.split(" ").at(-2).slice(-4)}`)

		const s4doc = r.split(" ").at(-2).slice(0, -8)

		const auth_token = await cap_doxlib.auth_token(); // Obtiene el token de autenticación para DOX.

		const latestHF = Object.values(headerFields.filter(item => item._value != null)
			.reduce((acc, item) => {
				acc[item.name] = item;
				return acc;
			}, {}))

		const latestLI = Object.values(lineItems.filter(item => item._value != null)
			.reduce((acc, item) => {
				acc[item.ID] = item;
				return acc;
			}, {}))

		// Envía los campos de encabezado y de línea a DOX usando la función post_ground_truth.
		const { job_status, IDlist } = await cap_doxlib.post_ground_truth(latestHF, latestLI, doxID, auth_token);

		// Verifica si la respuesta de la función post_ground_truth fue exitosa.
		if (!job_status)
			request.error("Error al enviar ground truth a DOX:");
		else if (job_status.status != 'DONE')
			request.error(`Error DOX: ${res.message}`);

		return { IDlist, s4doc }

	} catch (error) {
		// Maneja errores ocurridos durante el proceso de actualización y los envía en la respuesta.
		console.log("Error al actualizar estados de enviado:")
		request.error(error.message);
	}
}
