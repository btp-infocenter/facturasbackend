namespace facturasminibackend;

using
{
    cuid,
    managed
}
from '@sap/cds/common';

entity Fotos : cuid, managed
{
    imagen : LargeString;
    mimetype : String(5);
    doxID : String(50);
    s4ID : String(50);
}

type dato
{
    name : String(100);
    coor_x : Decimal;
    coor_y : Decimal;
    coor_h : Decimal;
    coor_w : Decimal;
    valorAC : String(250);
    valor : String(250);
    confidence : Decimal;
    lineitem : Integer;
}