const cds = require("@sap/cds-sqlite/lib/cds")

/**
 * Manejador de eventos para DELETE y UPDATE en la entidad 'Datos' del servicio 'facturasbackendService'.
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

/* Verificar que el Dato no sea AutoGenerado y 
 * que no se haya enviado.
 * Restricción aplicada para EDITAR o ELIMINAR
 * un Dato.
 */
module.exports = async function(request) {
    const { DatosHeader } = cds.entities;

    // Expresión regular para validar que el ID sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const ID = request.params[0];

    if (!uuidRegex.test(ID)) {
        request.error('El parametro no es UUID');
    }

    // [Advertencia] Consulta con SELECT.one, puede necesitar optimización si se hace en grandes volúmenes
    // Obtener el Dato y verificar campos 'autoCreado' y 'enviado'
    const dato = await SELECT.one
        .columns('autoCreado', 'enviado')
        .from(DatosHeader)
        .where({
            ID: ID,
        })
		.and(
			{ or: [{ autoCreado: true }, { enviado: true }] }
		);

    // Si el dato fue generado automáticamente, no permitir su modificación
    if (dato.autoCreado) {
        request.error('Los datos extraidos automáticamente no se pueden modificar');
    } else {
        console.log("👍 Check-autoGenerado");
    }

    // Si el dato ya fue enviado, no permitir su modificación
    if (dato.enviado) {
        request.error('Los datos enviados no se pueden modificar');
    } else {
        console.log("👍 Check-enviado");
    }
}
