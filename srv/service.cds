using { facturasbackend as my } from '../db/schema.cds';

@path : '/service/facturasbackendService'
service facturasbackendService
{
    annotate Datos with @restrict :
    [
        { grant : [ 'READ', 'UPDATE' ], to : [ 'facturasUser' ] }
    ];

    annotate Fotos with @restrict :
    [
        { grant : [ 'READ', 'CREATE', 'UPDATE', 'DELETE', 'enviar' ], to : [ 'facturasManager' ] },
        { grant : [ 'READ', 'CREATE', 'UPDATE', 'enviar' ], to : [ 'facturasUser' ] }
    ];

    annotate Items with @restrict :
    [
        { grant : [ 'READ' ], to : [ 'facturasUser' ] }
    ];

    annotate Values with @restrict :
    [
        { grant : [ '*' ], to : [ 'facturasUser' ] }
    ];

    annotate Values with @Aggregation.ApplySupported : 
    {
        $Type : 'Aggregation.ApplySupportedType',
        GroupableProperties :
        [
            datos_ID
        ],
        AggregatableProperties :
        [
            {
                Property : createdAt
            }
        ]
    };

    entity Fotos as
        projection on my.Fotos
        actions
        {
            action enviar
            (
            )
            returns String;
        };

    entity Datos as
        projection on my.Datos;

    entity Items as
        projection on my.Items;

    @Aggregation.CustomAggregate#createdAt : 'Edm.DateTime'
    entity Values as
        projection on my.Values;
}
