const cds = require('@sap/cds');
const supertest = require('supertest');
const fs = require('fs');
const { expect } = require('chai');
let value, newvalue

describe('Crear entradas', () => {
  let request, server;

  beforeAll(async () => {
    server = await cds.server();
    request = supertest(server);
  });

  it('Crear Foto', async () => {
    const newFoto = {
      ID: '99999999-0000-1111-2222-aaaabbbbcccc',
      mimetype: 'jpeg'
    };

    const postResponse = await request
      .post('/service/facturasbackendService/Fotos')
      .send(newFoto)
      .set('Content-Type', 'application/json')
      .expect(201);
  });

  it('Intentar procesar', async () => {
    const postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.dox')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(500);
    expect(postResponse.body.error).to.have.property('message');
    expect(postResponse.body.error.message).to.match(/imagen/);
  });

  it('Intentar enviar', async () => {
    const postResponse = await request
      .post('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/facturasbackendService.enviar')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(500);
    expect(postResponse.body.error).to.have.property('message');
    expect(postResponse.body.error.message).to.match(/procesada/);
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });
});


describe('Subir imagen base64', () => {
  let request, server;
  var img = ''

  beforeAll(async () => {
    server = await cds.server();
    request = supertest(server);
  });

  it('Obtener imagen de prueba', async () => {
    let getResponse = await request
      .get('/service/facturasbackendService/Fotos(e35b60f0-cdd7-42a9-812d-97cf4a1008c5)/imagen')

    expect(getResponse.status).to.equal(200);
    expect(getResponse.body.value).to.not.be.undefined;

    img = getResponse.body.value
  })

  it('Intentar subir imag [413]', async () => {
    let postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.upload')
      .send({
        imagen: img
      })
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(413);
  })

  it('Subir imagenes', async () => {
    for (let i = 0; i < img.length; i += 50000) {
      let porcion = img.substring(i, i + 50000);

      let postResponse = await request
        .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.upload')
        .send({
          imagen: porcion
        })
        .set('Content-Type', 'application/json');

      expect(postResponse.status).to.equal(204);
    }
  })

  it('Verificar imagen subida', async () => {

    let postResponse = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)')

    expect(postResponse.status).to.equal(200);
    expect(postResponse.body.imagen).not.to.equal(null)
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });

  it('Intentar enviar', async () => {
    const postResponse = await request
      .post('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/facturasbackendService.enviar')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(500);
    expect(postResponse.body.error).to.have.property('message');
    expect(postResponse.body.error.message).to.match(/procesada/);
  });

  it('Subir imagen (404)', async () => {

    let postResponse = await request
      .post('/service/uploadPhoto/Fotos(0000-1111-2222-aaaabbbbcccc)/uploadPhoto.upload')
      .send({
        imagen: 'imagen1'
      })
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(404);
  });
});

describe('Procesar en DOX', () => {
  let request, server;

  beforeAll(async () => {
    server = await cds.server();
    request = supertest(server);
  });

  it('404', async () => {
    const postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-1111-2222-aaaabbbbcccc)/uploadPhoto.dox')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(404);
  });

  it('DOX', async () => {
    const postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.dox')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(204);
  });

  it('Intentar DOX', async () => {
    const postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.dox')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).to.equal(500);
    expect(postResponse.body.error).to.have.property('message');
    expect(postResponse.body.error.message).to.match(/procesada/);
  });

  it('Metadata de Foto', async () => {
    const getResponse = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)?$select=procesado,enviado,status,doxID')
      .expect(200)

    expect(getResponse.body.procesado).to.equal(true);
    expect(getResponse.body.enviado).to.equal(false);
    expect(getResponse.body.status).to.equal('DONE');
    expect(getResponse.body).to.have.property('doxID');
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });
});

describe('Manipular Datos', () => {
  let request, server;
  let dato;

  beforeAll(async () => {
    server = await cds.server();
    request = supertest(server);
  });

  it('verificar items', async () => {
    const getResponse = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/datosItems')
      .expect(200)

    expect(Array.isArray(getResponse.body.value)).to.equal(true)
  });

  it('verificar datos', async () => {
    const getResponse1 = await request
      .get("/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/datosHeader?$filter=name eq 'nombre'")
      .expect(200)

    expect(getResponse1.body).to.have.property('value')
    expect(Array.isArray(getResponse1.body.value)).to.equal(true)

    dato = getResponse1.body.value[0].ID
  });

  it('verificar item', async () => {
    const getResponse2 = await request
      .get(`/service/facturasbackendService/Datos/${dato}/value`)
      .expect(200)

    expect(getResponse2.body).to.have.property('value')
    expect(Array.isArray(getResponse2.body.value)).to.equal(true)
    value = getResponse2.body.value[0].ID

    expect(getResponse2.body.value[0]).to.have.property('autoCreado')
    expect(getResponse2.body.value[0].autoCreado).to.equal(true)
    expect(getResponse2.body.value[0].enviado).to.equal(false)
    expect(getResponse2.body.value[0].value).not.to.equal(null)
  });

  it('Intentar modificar y eliminar', async () => {
    const getResponse1 = await request
      .get(`/service/facturasbackendService/Values(${value})`)
      .expect(200)

    expect(getResponse1.body.value).not.to.equal("modifyvalue");

    const patchResponse = await request
      .patch(`/service/facturasbackendService/Values(${value})`)
      .send({ value: 'newvalue' })
      .set('Content-Type', 'application/json')
      .expect(500)

    expect(patchResponse.status).to.equal(500);
    expect(patchResponse.body.error).to.have.property('message');
    expect(patchResponse.body.error.message).to.match(/automáticamente/);

    const getResponse2 = await request
      .get(`/service/facturasbackendService/Values(${value})`)
      .expect(200)

    expect(getResponse2.body.value).not.to.equal("modifyvalue");

    const posthResponse = await request
      .delete(`/service/facturasbackendService/Values(${value})`)
      .expect(500)

    expect(posthResponse.status).to.equal(500);
    expect(posthResponse.body.error).to.have.property('message');
    expect(posthResponse.body.error.message).to.match(/automáticamente/);

    const getResponse3 = await request
      .get(`/service/facturasbackendService/Values(${value})`)
      .expect(200)

    expect(getResponse3.body.value).not.to.equal("modifyvalue");
  });

  it('Agregar Value', async () => {
    const postResponse = await request
      .post('/service/facturasbackendService/Values')
      .send({
        value: 'newvalue',
        datos_ID: dato
      })
      .set('Content-Type', 'application/json')
      .expect(201)

    expect(postResponse.body).to.have.property('value')
    expect(postResponse.body.datos_ID).not.to.equal(null)
    expect(postResponse.body.autoCreado).to.equal(false)
    expect(postResponse.body.enviado).to.equal(false)
    expect(postResponse.body.value).not.to.equal(null)
  });

  it('Verificar Value', async () => {
    const getResponse = await request
      .get(`/service/facturasbackendService/Datos(${dato})/value?$orderby=createdAt desc`)
      .expect(200)

    expect(getResponse.body).to.have.property('value')
    expect(Array.isArray(getResponse.body.value)).to.equal(true)
    expect(getResponse.body.value[0].value).to.equal('newvalue')
    expect(getResponse.body.value[1].value).not.to.equal('newvalue')

    newvalue = getResponse.body.value[0].ID
  });

  it('Modificar', async () => {
    const patchResponse = await request
      .patch(`/service/facturasbackendService/Values(${newvalue})`)
      .send({ value: 'modifyvalue' })
      .set('Content-Type', 'application/json')
      .expect(200)

    const getResponse = await request
      .get(`/service/facturasbackendService/Values(${newvalue})`)
      .expect(200)

    expect(getResponse.body.value).to.equal('modifyvalue');
    expect(getResponse.body.value).not.to.equal('newvalue');
    expect(getResponse.body.autoCreado).to.equal(false);
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });
});

describe('Mandar a S4', () => {
  let request, server;

  beforeAll(async () => {
    server = await cds.server();
    request = supertest(server);
  });

  it('404', async () => {
    const postResponse = await request
      .post('/service/facturasbackendService/Fotos(99999999-1111-2222-aaaabbbbcccc)/facturasbackendService.enviar')
      .send()
      .set('Content-Type', 'application/json')
      .expect(404);
  });

  it('Enviar', async () => {
    const postResponse = await request
      .post('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/facturasbackendService.enviar')
      .send()
      .set('Content-Type', 'application/json')
      .expect(200);
  });


  it('check Enviado', async () => {
    const getFoto = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/enviado')
      .expect(200);

    expect(getFoto.body.value).to.equal(true);

    const getOldValue = await request
      .get(`/service/facturasbackendService/Values(${value})/enviado`)
      .expect(200);


    const getNewValue = await request
      .get(`/service/facturasbackendService/Values(${newvalue})/enviado`)
      .expect(200);

    expect(getOldValue.body.value).to.equal(false);
    expect(getNewValue.body.value).to.equal(true);
  });

  it('check s4doc', async () => {
    const getFoto = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/s4doc')
      .expect(200);

    expect(getFoto.body.value).not.to.equal(null);
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });
});