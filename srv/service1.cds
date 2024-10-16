using { facturasbackend as my } from '../db/schema.cds';

extend my.Fotos
{
    extend imagen
        @cap_dox;
}

@path : '/service/uploadPhoto'
service uploadPhoto
{
    entity Fotos as
        projection on my.Fotos
        actions
        {
            action upload
            (
                imagen : LargeString
            );

            action dox
            (
            );
        };
}

annotate uploadPhoto with @restrict :
[
    { grant : [ '*' ], to : [ 'facturasUser' ] }
];
