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
    datos : Association to many DatosHeader on datos.fotos = $self;
}

entity DatosHeader : cuid, managed
{
    status : String(10) not null;
    doxId : String(100);
    nombreRemitente : Field;
    rucRemitente : Field;
    timbrado : Field;
    autoCreado : Boolean default false;
    enviado : Boolean default false;
    fotos : Association to one Fotos;
    items : Composition of many DatosItems on items.datosHeader = $self;
}

entity DatosItems : cuid, managed
{
    descripcion : Field;
    precioUnitario : Field;
    datosHeader : Association to one DatosHeader;
}

type Coordinates
{
    x : Decimal;
    y : Decimal;
    w : Decimal;
    h : Decimal;
}

type Field
{
    value : String(100);
    confidence : Decimal;
    coordinates : Coordinates;
}
