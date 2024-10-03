namespace facturasbackend;

using
{
    cuid,
    managed
}
from '@sap/cds/common';

entity Fotos : cuid, managed
{
    imagen : LargeString;
    mimetype : String(10);
    enviado : Boolean default false;
    procesado : Boolean default false;
    datos : Association to many Datos on datos.fotos = $self;
}

entity Datos : cuid, managed
{
    timbrado : String(100);
    ruc : String(50);
    receptor : String(100);
    emisor : String(100);
    total : Decimal;
    autoCreado : Boolean default false;
    enviado : Boolean default false;
    fotos : Association to one Fotos
        @assert.target;
}
