/**
 * Manejador de eventos @Before para el evento 'dox' en la entidad 'Fotos' del servicio 'uploadPhoto'.
 * Verifica que una foto no haya sido procesada previamente antes de permitir su procesamiento.
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */
module.exports = async function (request) {
    const { Fotos } = cds.entities('facturasbackend');
    const foto_ID = request.params[0];

    // Seleccionar solo si la foto ha sido procesada previamente
    const foto = await SELECT.one
        .columns('procesado', 'imagen')
        .from(Fotos)
        .where({ID: foto_ID})

    // Si la foto ya ha sido procesada, lanzar un error
    if (!foto)
        request.error("La foto no existe");
    else if (foto.procesado)
        request.error("La foto ya ha sido procesada");
    else if (!foto.imagen)
        request.error("La foto no tiene imagen asociada");
    else
        console.log("👍 Check-procesado");
}
