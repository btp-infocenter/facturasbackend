using { facturasminibackend as my } from '../db/schema.cds';

@path : '/service'
service service
{
    entity Fotos as
        projection on my.Fotos
        actions
        {
            function dox
            (
            )
            returns String;

            function upload
            (
                imagen : LargeString
            )
            returns String;

            function datos
            (
            )
            returns my.dato;

            function enviar
            (
            )
            returns String;

            action update_datos
            (
                headerFields : many String(100),
                lineItems : many String(100)
            )
            returns String;
        };
}

annotate service with @requires :
[
    'authenticated-user'
];
