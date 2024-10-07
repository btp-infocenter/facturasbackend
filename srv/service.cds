using { facturasbackend as my } from '../db/schema.cds';

@path : '/service/facturasbackendService'
service facturasbackendService
{
    annotate DatosHeader with @restrict :
    [
        { grant : [ '*' ], to : [ 'facturasUser' ] }
    ];

    annotate DatosItems with @restrict :
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

    entity DatosHeader as
        projection on my.DatosHeader
        actions
        {
            action enviar
            (
            )
            returns DatosHeader;
        };

    entity DatosItems as
        projection on my.DatosItems;
}
