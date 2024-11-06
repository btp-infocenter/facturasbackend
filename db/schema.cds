namespace facturasbackend;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity Fotos : cuid, managed {
    imagen      : LargeString;
    enviado     : Boolean default false;
    procesado   : Boolean default false;
    datosHeader : Composition of many Datos
                      on datosHeader.fotos = $self;
    datosItems  : Composition of many Items
                      on datosItems.fotos = $self;
    doxID       : String(50);
    status      : String(50);
    mimetype    : String(5);
}

type Coordinates {
    x : Decimal;
    y : Decimal;
    w : Decimal;
    h : Decimal;
}

entity Datos : cuid, managed {
    name        : String(100);
    confidence  : Decimal;
    model       : String(10);
    coordinates : Coordinates;
    fotos       : Association to one Fotos
                  @assert.target;
    value       : Composition of many Values
                      on value.datos = $self;
    items       : Association to one Items;
}

entity Items {
    key ID        : UUID;
        fotos     : Association to one Fotos not null
                    @assert.target;
        lineItems : Composition of many Datos
                        on lineItems.items = $self;
}

entity Values : cuid, managed {
    value      : String(100);
    autoCreado : Boolean default false;
    enviado    : Boolean default false;
    datos      : Association to one Datos
                 @assert.target;
}
