/**
 * Code is auto-generated by Application Logic, DO NOT EDIT.
 * @version(2.0)
 */
const LCAPApplicationService = require('@sap/low-code-event-handler');
const check_Ac_Enviado = require('./code/check-ac-enviado');
const reset_Enviado = require('./code/reset-enviado');
const check_Enviado = require('./code/check-enviado');
const set_Enviado = require('./code/set-enviado');
const enviar_logic = require('./code/enviar_logic');

class facturasbackendService extends LCAPApplicationService {
    async init() {

        this.on(['DELETE', 'UPDATE'], 'Values', async (request, next) => {
            await check_Ac_Enviado(request);
            return next();
        });

        

        this.before('enviar', 'Fotos', async (request) => {
            await check_Enviado(request);
        });

        this.on('enviar', 'DatosHeader', async (request, next) => {
            return enviar_Logic(request);
        });

        this.after('enviar', 'Fotos', async (results, request) => {
            await set_Enviado(results, request);
        });

        this.on('enviar', 'Fotos', async (request, next) => {
            return enviar_logic(request);
        });

        return super.init();
    }
}


module.exports = {
    facturasbackendService
};