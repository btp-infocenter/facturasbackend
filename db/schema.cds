namespace facturasminibackend;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity Photos : cuid, managed {
    imagen : LargeString;
    mimetype : String(5);
    s4OrdenID : String(50);
    s4MaterialID : String(50);
    s4FacturaID : String(50);
    datos : Composition of many facturasminibackend.Datos on datos.photos = $self;
}

entity Datos : cuid, managed {
    name : String(100);
    confidence : Decimal;
    coordinates : Coordinates;
    value : String(100);
    valorAI : String(100);
    item : Integer;
    photos : Association to one facturasminibackend.Photos @assert.target : 'facturasminibackend.Photos';
}

type Coordinates {
    x : Decimal;
    y : Decimal;
    w : Decimal;
    h : Decimal;
}

type dato {
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
