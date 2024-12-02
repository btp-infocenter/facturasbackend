/**
 * 
 * @On(event = { "enviar" }, entity = "service.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const { post_factura, post_orden, post_material } = require('./lib_cap_s4');
const cap_doxlib = require('./lib_cap_dox');

module.exports = async function (request) {
	const { Fotos } = cds.entities('facturasminibackend');
	const foto_ID = request.params[0];

	const orden = {
		CompanyCode: "1000",
		PurchaseOrderType: "ZNAC",
		PurchasingGroup: "001",
		PurchasingOrganization: "1000",
		DocumentCurrency: "PYG",
		Supplier: "1",
		to_PurchaseOrderItem: {
			results: [
				{
					Material: "RP.00002",
					OrderQuantity: "10",
					Plant: "6000",
					NetPriceAmount: "1500"
				}
			]
		}
	}

	const purchaseOrder = await post_orden(orden)

	if (purchaseOrder.error) {
		request.error(JSON.stringify(purchaseOrder.error))
		return
	}

	await UPDATE.entity(Fotos)
		.data({
			s4OrdenID: purchaseOrder
		})
		.where({ ID: foto_ID })

	console.log("Purch. Order:", purchaseOrder)

	const material = {
		GoodsMovementCode: "01",
		PostingDate: "/Date(1730505600000)/",
		to_MaterialDocumentItem: {
			results: [
				{
					Material: "RP.00002",
					Plant: "6000",
					StorageLocation: "6700",
					QuantityInEntryUnit: "1",
					GoodsMovementType: "101",
					InventoryStockType: "01",
					PurchaseOrder: purchaseOrder,
					PurchaseOrderItem: "10",
					Supplier: "1",
					GoodsMovementRefDocType: "B"
				}
			]
		}
	}

	const materialdocument = await post_material(material)

	console.log("Material Doc.:", materialdocument)

	if (materialdocument.error) {
		request.error(JSON.stringify(materialdocument.error))
		return
	}

	await UPDATE.entity(Fotos)
		.data({
			s4MaterialID: materialdocument
		})
		.where({ ID: foto_ID })

}