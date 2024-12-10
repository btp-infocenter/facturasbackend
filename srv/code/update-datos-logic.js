/**
 *
 * @On(event = { "update_datos" }, entity = "service.Photos")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
 */

module.exports = async function (request) {
  const { Photos, Datos } = cds.entities("facturasminibackend");
  const foto_ID = request.params[0];

  const headerFields = request.data.headerFields.map((item) =>
    JSON.parse(item)
  );
  const lineItems = request.data.lineItems.map((item) => JSON.parse(item));

  for (let header of headerFields) {
    await UPDATE.entity(Datos)
      .data({
        value: header.value,
      })
      .where({
        and: { photos_ID: foto_ID, name: header.name },
      });
  }

  for (let line of lineItems) {
    await UPDATE.entity(Datos)
      .data({
        value: line.value,
      })
      .where({
        and: { photos_ID: foto_ID, name: line.name, item: line.orden },
      });
  }

  const modifiedAt = new Date();

  await UPDATE.entity(Photos)
    .data({
      modifiedAt,
    })
    .where({
      ID: foto_ID,
    });

  return { dox: null, modifiedAt };
};
