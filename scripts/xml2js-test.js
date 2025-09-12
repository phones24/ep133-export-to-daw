// import xml2js from 'xml2js';

// const builder = new xml2js.Builder({
//   attrkey: '_attrs',
//   charkey: '_text',
//   renderOpts: {
//     indent: '    ',
//     pretty: true,
//   },
// });

// // const root = {
// //   a: 1,
// //   b: 2,
// // };

// const parser = new xml2js.Parser({
//   attrkey: '_attrs',
//   charkey: '_text',
//   // childkey: '_children',
//   // explicitArray: false,
//   explicitCharkey: true,
//   preserveChildrenOrder: true,
//   explicitChildren: true,
// });

const xmlll = `
<root id="aaa">
  <gr id="1"><Value id="1" /></gr>
  <t id="2">1</t>
  <t id="3">1</t>
  <gr id="4">1</gr>
  <t id="5">1</t>
  <t id="6">1</t>
</root>
  `;

// const parsed = await parser.parseStringPromise(xmlll);

// console.log(parsed);
// console.log(parsed.root._children);

// console.log(builder.buildObject(parsed));

import { create } from 'xmlbuilder2';

const doc = create(xmlll);

// doc.root().ele('baz');

const obj = doc.end({ format: 'object' });
console.log(obj.root);

const docnew = create(obj);
const xml = docnew.end({ prettyPrint: true });
console.log(xml);
