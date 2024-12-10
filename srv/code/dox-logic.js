/**
 *
 * @On(event = { "DOX" }, entity = "service.Foto")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
 */

const { post_job, auth_token } = require("./lib_cap_dox");
const { process_docai } = require("./documentai");
const { docai2cap } = require("./parser");

module.exports = async function (request) {
  const { Photos, Datos } = cds.entities("facturasminibackend");
  const photos_ID = request.params[0];

  console.log("Starting extraction ...");

  const { imagen, mimetype } = await SELECT.one
    .from(Photos)
    .columns(["imagen", "mimetype"])
    .where({ ID: photos_ID });

  const res = await process_docai(imagen, mimetype);

  const cap = await docai2cap(res, photos_ID);

  await INSERT.into(Datos).entries(cap);

  const modifiedAt = new Date();

  await UPDATE.entity(Photos)
    .data({
      modifiedAt,
    })
    .where({ ID: photos_ID });

  console.log("👍 Procesado en Google Document AI");

  return { job_id: null, modifiedAt };
};
