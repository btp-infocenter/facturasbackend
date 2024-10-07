/**
 * Manejador de eventos @Before para el evento 'enviar' en la entidad 'Datos' del servicio 'facturasbackendService'.
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

/* Verificar que el Dato no haya sido enviado
 * anteriormente.
 * Restricción aplicada para el evento /enviar de un Dato.
 */
module.exports = async function(request) {
    const { DatosHeader } = cds.entities;
    const dato_ID = request.params[0];

    // [Advertencia] Consulta con SELECT.one, puede necesitar optimización en grandes volúmenes
    // Verificar si el dato ya ha sido enviado
    const dato = await SELECT.one
        .columns('1 as found')
        .from(DatosHeader)
        .where({
            ID: dato_ID,
			enviado: true
        });

    // Si el dato ya ha sido enviado, lanzar un error
    if (dato) {
        request.error('Los datos enviados no se pueden modificar');
    } else {
        console.log("👍 Check-enviado");
    }
}
