/**
 * 
 * @On(event = { "enviar" }, entity = "service.Fotos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const axios = require('axios');
const { post_orden, post_factura } = require('./lib_cap_s4');
const { parse2s4 } = require('./parser');

module.exports = async function (request) {
	const { Fotos } = cds.entities('facturasminibackend');
	const foto_ID = request.params[0];

	const datos = await parse2s4(foto_ID)

	const orden = {
		CompanyCode: "1000",
		PurchaseOrderType: "ZNAC",
		PurchasingGroup: "001",
		PurchasingOrganization: "1000",
		DocumentCurrency: datos.DocumentCurrency,
		Supplier: datos.Supplier,
		Language: "ES",
		to_PurchaseOrderItem: {
			results: datos.lineItems.map(item => ({
				PurchaseOrderItem: item.PurchaseOrderItem,
				AccountAssignmentCategory: "K",
				GoodsReceiptIsExpected: false,
				Plant: "1000",
				DocumentCurrency: datos.DocumentCurrency,
				TaxCode: item.TaxCode,
				NetPriceAmount: item.NetPriceAmount,
				Material: item.Material,
				PurchaseOrderItemText: item.PurchaseOrderItemText,
				OrderQuantity: item.OrderQuantity,
				to_AccountAssignment: {
					results: [
						{
							GLAccount: "5202010014",
							CostCenter: "PYDMAS1099"
						}
					]
				}
			}))
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


	const factura = {
		CompanyCode: "1000",
		SupplierInvoiceIDByInvcgParty: datos.SupplierInvoiceIDByInvcgParty,
		InvoicingParty: datos.InvoicingParty,
		DocumentCurrency: datos.DocumentCurrency,
		DocumentDate: datos.DocumentDate,
		PostingDate: "2024-12-03T16:15",
		TaxIsCalculatedAutomatically: true,
		InvoiceGrossAmount: datos.InvoiceGrossAmount,
		to_SuplrInvcItemPurOrdRef: {
			results: datos.lineItems.map(item => ({
				SupplierInvoiceItem: item.SupplierInvoiceItem,
				DocumentCurrency: datos.DocumentCurrency,
				PurchaseOrder: purchaseOrder,
				SupplierInvoiceItemAmount: item.SupplierInvoiceItemAmount,
				PurchaseOrderItem: item.PurchaseOrderItem,
				TaxCode: item.TaxCode,
				IsFinallyInvoiced: false,
				to_SupplierInvoiceItmAcctAssgmt: {
					results: [
						{
							SupplierInvoiceItem: item.SupplierInvoiceItem,
							CostCenter: "PYDMAS1099",
							GLAccount: "5202010014",
							DocumentCurrency: datos.DocumentCurrency,
							SuplrInvcAcctAssignmentAmount: item.SuplrInvcAcctAssignmentAmount,
							PurchaseOrderQuantityUnit: "UN",
							Quantity: item.Quantity,
							TaxCode: item.TaxCode,
							AccountAssignmentNumber: item.AccountAssignmentNumber
						}
					]
				}
			}))
		}
	}

	const supplierinvoice = await post_factura(factura)

	console.log("Factura:", supplierinvoice)

	if (supplierinvoice.error) {
		request.error(JSON.stringify(supplierinvoice.error))
		return
	}

	const modifiedAt = new Date()

	await UPDATE.entity(Fotos)
		.data({
			s4FacturaID: supplierinvoice,
			modifiedAt
		})
		.where({ ID: foto_ID })

	const materialdocument = "null"


	return { S4: { orden: purchaseOrder, material: materialdocument, factura: supplierinvoice }, modifiedAt }
}