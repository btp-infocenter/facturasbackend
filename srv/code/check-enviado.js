/**
 * Manejador de eventos @Before para el evento 'enviar' en la entidad 'Datos' del servicio 'facturasbackendService'.
 * @param {Object} request - Información del usuario, modelo específico del tenant, headers y parámetros de consulta.
 */

/* Verificar que el Dato no haya sido enviado
 * anteriormente.
 * Restricción aplicada para el evento /enviar de un Dato.
 */
module.exports = async function (request) {
    const { Fotos } = cds.entities('facturasbackend');
    const foto_ID = request.params[0];

    // Verificar si el dato ya ha sido enviado
    const foto = await SELECT.one
        .columns('enviado', 'procesado')
        .from(Fotos)
        .where(
            { ID: foto_ID}
        )
        .or({
            procesado: false,
            enviado: true
        })

    // Si el dato ya ha sido enviado, lanzar un error
    if (foto) {
        if (foto.enviado) 
            request.error('La foto ya ha sido enviada');
        else if (!foto.procesado)
            request.error('La foto aun no ha sido procesada');
    }else {
        console.log("👍 Check-enviado/procesado");
    }
}
