/**
 * Manejador de eventos @Before para el evento 'enviar' en la entidad 'Datos' del servicio 'facturasbackendService'.
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

/* Verificar que el Dato no haya sido enviado
 * anteriormente.
 * Restricción aplicada para el evento /enviar de un Dato.
 */
module.exports = async function(request) {
    const { Fotos } = cds.entities;
    const foto_ID = request.params[0];

    // Verificar si el dato ya ha sido enviado
    const foto = await SELECT.one
        .columns('1 as found')
        .from(Fotos)
        .where({
            ID: foto_ID,
			enviado: true
        });

    // Si el dato ya ha sido enviado, lanzar un error
    if (foto) {
        request.error('Los datos enviados no se pueden modificar');
    } else {
        console.log("👍 Check-enviado");
    }
}
