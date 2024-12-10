using { facturasminibackend as my } from '../db/schema.cds';

@path : '/service'
service service
{
    entity Photos as
        projection on my.Photos
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

    entity Datos as projection on my.Datos;
}

annotate service with @requires :
[
    'authenticated-user'
];
