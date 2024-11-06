const cds = require('@sap/cds');
const supertest = require('supertest');
const fs = require('fs');
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

    expect(postResponse.status).toBe(500);
    expect(postResponse.body.error).toHaveProperty('message');
    expect(postResponse.body.error.message).toMatch(/imagen/);
  });

  it('Intentar enviar', async () => {
    const postResponse = await request
      .post('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/facturasbackendService.enviar')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).toBe(500);
    expect(postResponse.body.error).toHaveProperty('message');
    expect(postResponse.body.error.message).toMatch(/procesada/);
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

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.value).toBeDefined();

    img = getResponse.body.value
  })

  it('Intentar subir imag [413]', async () => {
    let postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.upload')
      .send({
        imagen: img
      })
      .set('Content-Type', 'application/json');

    expect(postResponse.status).toBe(413);
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

      expect(postResponse.status).toBe(204);
    }
  })

  it('Verificar imagen subida', async () => {

    let postResponse = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)')

    expect(postResponse.status).toBe(200);
    expect(postResponse.body.imagen).not.toBe(null)
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

    expect(postResponse.status).toBe(500);
    expect(postResponse.body.error).toHaveProperty('message');
    expect(postResponse.body.error.message).toMatch(/procesada/);
  });

  it('Subir imagen (404)', async () => {

    let postResponse = await request
      .post('/service/uploadPhoto/Fotos(0000-1111-2222-aaaabbbbcccc)/uploadPhoto.upload')
      .send({
        imagen: 'imagen1'
      })
      .set('Content-Type', 'application/json');

    expect(postResponse.status).toBe(404);
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

    expect(postResponse.status).toBe(404);
  });

  it('DOX', async () => {
    const postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.dox')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).toBe(204);
  });

  it('Intentar DOX', async () => {
    const postResponse = await request
      .post('/service/uploadPhoto/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/uploadPhoto.dox')
      .send()
      .set('Content-Type', 'application/json');

    expect(postResponse.status).toBe(500);
    expect(postResponse.body.error).toHaveProperty('message');
    expect(postResponse.body.error.message).toMatch(/procesada/);
  });

  it('Metadata de Foto', async () => {
    const getResponse = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)?$select=procesado,enviado,status,doxID')
      .expect(200)

    expect(getResponse.body.procesado).toBe(true);
    expect(getResponse.body.enviado).toBe(false);
    expect(getResponse.body.status).toBe('DONE');
    expect(getResponse.body).toHaveProperty('doxID');
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

    expect(Array.isArray(getResponse.body.value)).toBe(true)
  });

  it('verificar datos', async () => {
    const getResponse = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/datosHeader')
      .expect(200)

    expect(Array.isArray(getResponse.body.value)).toBe(true)
  });

  it('verificar items', async () => {
    const getResponse1 = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/datosHeader')
      .expect(200)

    expect(getResponse1.body).toHaveProperty('value')
    expect(Array.isArray(getResponse1.body.value)).toBe(true)
    dato = getResponse1.body.value[0].ID

    const getResponse2 = await request
      .get(`/service/facturasbackendService/Datos/${dato}/value`)
      .expect(200)

    expect(getResponse2.body).toHaveProperty('value')
    expect(Array.isArray(getResponse2.body.value)).toBe(true)
    value = getResponse2.body.value[0].ID

    expect(getResponse2.body.value[0]).toHaveProperty('autoCreado')
    expect(getResponse2.body.value[0].autoCreado).toBe(true)
    expect(getResponse2.body.value[0].enviado).toBe(false)
    expect(getResponse2.body.value[0].value).not.toBe(null)
  });

  it('Intentar modificar y eliminar', async () => {
    const getResponse1 = await request
      .get(`/service/facturasbackendService/Values(${value})`)
      .expect(200)
    
    expect(getResponse1.body.value).not.toBe("modifyvalue");

    const patchResponse = await request
      .patch(`/service/facturasbackendService/Values(${value})`)
      .send({ value: 'newvalue' })
      .set('Content-Type', 'application/json')
      .expect(500)

    expect(patchResponse.status).toBe(500);
    expect(patchResponse.body.error).toHaveProperty('message');
    expect(patchResponse.body.error.message).toMatch(/automáticamente/);

    const getResponse2 = await request
      .get(`/service/facturasbackendService/Values(${value})`)
      .expect(200)
    
    expect(getResponse2.body.value).not.toBe("modifyvalue");

    const posthResponse = await request
      .delete(`/service/facturasbackendService/Values(${value})`)
      .expect(500)

    expect(posthResponse.status).toBe(500);
    expect(posthResponse.body.error).toHaveProperty('message');
    expect(posthResponse.body.error.message).toMatch(/automáticamente/);

    const getResponse3 = await request
      .get(`/service/facturasbackendService/Values(${value})`)
      .expect(200)
    
    expect(getResponse3.body.value).not.toBe("modifyvalue");
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

    expect(postResponse.body).toHaveProperty('value')
    expect(postResponse.body.datos_ID).not.toBe(null)
    expect(postResponse.body.autoCreado).toBe(false)
    expect(postResponse.body.enviado).toBe(false)
    expect(postResponse.body.value).not.toBe(null)
  });

  it('Verificar Value', async () => {
    const getResponse = await request
      .get(`/service/facturasbackendService/Datos(${dato})/value?$orderby=createdAt desc`)
      .expect(200)

    expect(getResponse.body).toHaveProperty('value')
    expect(Array.isArray(getResponse.body.value)).toBe(true)
    expect(getResponse.body.value[0].value).toBe('newvalue')
    expect(getResponse.body.value[1].value).not.toBe('newvalue')

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

    expect(getResponse.body.value).toBe('modifyvalue');
    expect(getResponse.body.value).not.toBe('newvalue');
    expect(getResponse.body.autoCreado).toBe(false);
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });
});

describe('Mandar a B1', () => {
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
      .expect(204);
  });


  it('check Enviado', async () => {
    const getFoto = await request
      .get('/service/facturasbackendService/Fotos(99999999-0000-1111-2222-aaaabbbbcccc)/enviado')
      .expect(200);

    expect(getFoto.body.value).toBe(true);

    const getOldValue = await request
      .get(`/service/facturasbackendService/Values(${value})/enviado`)
      .expect(200);


    const getNewValue = await request
      .get(`/service/facturasbackendService/Values(${newvalue})/enviado`)
      .expect(200);

    expect(getOldValue.body.value).toBe(false);
    expect(getNewValue.body.value).toBe(true);
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });
});