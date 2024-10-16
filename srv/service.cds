using { facturasbackend as my } from '../db/schema.cds';

@path : '/service/facturasbackendService'
service facturasbackendService
{
    annotate Datos with @restrict :
    [
        { grant : [ 'READ' ], to : [ 'facturasUser' ] }
    ];

    annotate Fotos with @restrict :
    [
        { grant : [ 'READ', 'CREATE', 'UPDATE', 'enviar' ], to : [ 'facturasUser' ] }
    ];

    annotate Items with @restrict :
    [
        { grant : [ 'READ' ], to : [ 'facturasUser' ] }
    ];

    annotate Values with @restrict :
    [
        { grant : [ 'READ', 'CREATE', 'UPDATE' ], to : [ 'facturasUser' ] }
    ];

    entity Fotos as
        projection on my.Fotos
        actions
        {
            action enviar
            (
            )
            returns Fotos;
        };


    entity Datos as
        projection on my.Datos;

        
    entity Items as
        projection on my.Items;



    entity Values as
        projection on my.Values;
}
