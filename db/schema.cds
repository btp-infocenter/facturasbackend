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
    imagenSmall : LargeString;
    enviado : Boolean default false;
    procesado : Boolean default false;
    doxID : String(50);
    s4doc : String(50);
    status : String(50);
    mimetype : String(5);
    datosItems : Composition of many Items on datosItems.fotos = $self;
    datosHeader : Composition of many Datos on datosHeader.fotos = $self;
}

type Coordinates
{
    x : Decimal;
    y : Decimal;
    w : Decimal;
    h : Decimal;
}

entity Datos : cuid, managed
{
    name : String(100);
    label : String(100);
    confidence : Decimal;
    model : String(10);
    coordinates : Coordinates;
    value : Composition of many Values on value.datos = $self;
    items : Association to one Items @assert.target;
    fotos : Association to one Fotos @assert.target;
}

entity Items
{
    key ID : UUID;
    lineItems : Composition of many Datos on lineItems.items = $self;
    fotos : Association to one Fotos @assert.target;
}

entity Values : cuid, managed
{
    value : String(250);
    autoCreado : Boolean default false;
    enviado : Boolean default false;
    datos : Association to one Datos
        @assert.target;
}
