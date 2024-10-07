using { facturasbackend as my } from '../db/schema.cds';

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

annotate my.Fotos with {
    imagen @cap_dox;
};

