/**
 * Manejador de eventos @Before para las operaciones CREATE, READ, UPDATE y DELETE en la entidad 'Datos' del servicio 'facturasbackendService'.
 * Verifica que la foto asociada al dato ya haya sido procesada por DOX antes de permitir la operación.
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

/* Verificar que la Foto asociada al Dato:
 * 1. Ya fue procesada por DOX.
 */
module.exports = async function(request) {
    const { Fotos, DatosHeader } = cds.entities;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const datos_ID = request.params[0]; // ID del Dato
    const method = Object.keys(request.query)[0]; // Método usado en la operación (INSERT, UPDATE, etc.)
    let fotos_ID;

    if (method == 'INSERT') {
        // Si es CREATE (INSERT), obtener fotos_ID del cuerpo de la solicitud
        fotos_ID = request.req.body.fotos_ID;
    } else {
        // Validación del formato del ID del dato (debe ser UUID)
        if (!uuidRegex.test(datos_ID)) {
            request.error('El parametro no es UUID');
            return;
        }

        // Combinar ambas consultas: obtener directamente si la foto asociada ya fue procesada
        const dato = await SELECT.one
            .from(DatosHeader)
            .columns('Fotos.procesado')  // Combina la relación de 'Fotos' y trae directamente 'procesado'
            .join(Fotos).on('DatosHeader.fotos_ID = Fotos.ID')  // Join explícito en la consulta
            .where({ 'DatosHeader.ID': datos_ID });
        
        if (!dato) {
            request.error("El dato no existe o no tiene foto asociada");
            return;
        }

        // Asignar el estado 'procesado' de la foto directamente
        if (!dato.procesado) {
            request.error("Espere a que la foto sea procesada");
            return;
        } else {
            console.log("👍 Check-procesado");
        }
    }
}
