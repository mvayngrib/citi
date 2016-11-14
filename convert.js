
module.exports = {
  product: toTradleProduct
}

/**
{
  "productCode": "MAXIB",
  "productDescription": "Citibank MaxiSave Account",
  "sourceCode": "TBC",
  "productType": "CASA",
  "currencyCode": "SGD",
  "latePaymentFee": 0,
  "importantInformations": "Placeholder for Show Details",
  "termsAndConditions": "By clicking \"submit\", you consent to (i) Citibank disclosing your information to Credit Bureau Singapore; and (ii) any such bureau to transfer and disclose to Citibank, any information relating to you and/or any of your account(s) (and for such purposes) as may be permitted under or pursuant to the Banking Act of Singapore",
  "agreementStartDate": "2016-11-14-05:00",
  "agreementExpiryDate": "2016-12-14-05:00"
}

to

{
  "id": "tradle.NotarizePropertyOwnership",
  "title": "Notarize Property Ownership",
  "interfaces": [
    "tradle.Message"
  ],
  "type": "tradle.Model",
  "forms": [
    "tradle.PersonalInfo",
    "tradle.PropertyOwnership"
  ],
  "subClassOf": "tradle.FinancialProduct",
  "properties": {
    "_t": {
      "type": "string",
      "readOnly": true
    },
    "from": {
      "type": "object",
      "readOnly": true,
      "ref": "tradle.Identity"
    },
    "to": {
      "type": "object",
      "readOnly": true,
      "ref": "tradle.Identity"
    }
  }
}
*/
function toTradleProduct (citiProduct) {
  return {
    type: 'tradle.Model',
    id: 'citi.' + citiProduct.productCode,
    title: citiProduct.productDescription,
    interfaces: [ 'tradle.Message' ],
    subClassOf: 'tradle.FinancialProduct',
    forms: [
      'tradle.PersonalInfo'
    ],
    properties: {
      _t: {
        type: 'string',
        readOnly: true
      },
      from: {
        type: 'object',
        readOnly: true,
        ref: 'tradle.Identity'
      },
      to: {
        type: 'object',
        readOnly: true,
        ref: 'tradle.Identity'
      }
    }
  }
}
