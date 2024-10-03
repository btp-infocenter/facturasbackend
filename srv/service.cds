using { facturasbackend as my } from '../db/schema.cds';

@path : '/service/facturasbackendService'
service facturasbackendService
{
    annotate Datos with @restrict :
    [
        { grant : [ '*' ], to : [ 'facturasUser' ] }
    ];

    annotate Fotos with @restrict :
    [
        { grant : [ 'READ', 'CREATE' ], to : [ 'facturasUser' ] },
        { grant : [ 'READ' ], to : [ 'any' ] }
    ];

    entity Fotos as
        projection on my.Fotos;

    entity Datos as
        projection on my.Datos
        actions
        {
            action enviar
            (
            )
            returns Datos;
        };
}
