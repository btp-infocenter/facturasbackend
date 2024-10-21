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
module.exports = async function (request) {
    const { Values } = cds.entities('facturasbackendService');
    const ID = request.params[0];

    // [Advertencia] Consulta con SELECT.one, puede necesitar optimización si se hace en grandes volúmenes
    // Obtener el Dato y verificar campos 'autoCreado' y 'enviado'

    const v = await SELECT.one
        .from(Values)
        .where({ID})

    const valor = await SELECT.one
        .columns('autoCreado', 'enviado')
        .from(Values)
        .where({ID});

    // Función de validación para evitar duplicación de lógica
    const validarCampo = (valor, campo, mensajeError) => {
        if (valor[campo]) {
            request.error(mensajeError);
        } else {
            console.log(`👍 Check ${campo}`);
        }
    };

    // Validar restricciones
    validarCampo(valor, 'autoCreado', 'Los datos extraidos automáticamente no se pueden modificar');
    validarCampo(valor, 'enviado', 'Los datos enviados no se pueden modificar');
}
