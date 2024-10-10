using { facturasbackend as my } from '../db/schema.cds';

@path : '/service/facturasbackendService'
service facturasbackendService
{
    annotate DatosHeader with @restrict :
    [
        { grant : [ '*' ], to : [ 'facturasUser' ] },
        { grant : [ '*' ], to : [ 'facturasManager' ] }
    ];

    annotate DatosItems with @restrict :
    [
        { grant : [ '*' ], to : [ 'facturasUser' ] },
        { grant : [ '*' ], to : [ 'facturasManager' ] }
    ];

    annotate Fotos with @restrict :
    [
        { grant : [ '*' ], to : [ 'facturasManager' ] },
        { grant : [ 'READ', 'CREATE' ], to : [ 'facturasUser' ] }
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

annotate facturasbackendService with @requires :
[
    'facturasManager'
];
