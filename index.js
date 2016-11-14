const querystring = require('querystring')
const crypto = require('crypto')
const typeforce = require('typeforce')
const extend = require('xtend')
// const thunky = require('thunky')
const Client = require('node-rest-client').Client
const levelup = require('levelup')
const leveldown = require('leveldown')
const uuid = require('uuid')
const types = require('./types')

module.exports = function (opts) {
  typeforce({
    client_id: typeforce.String,
    client_secret: typeforce.String,
    db: typeforce.String
  }, opts)

  const cache = {}
  const client_id = opts.client_id
  const client_secret = opts.client_secret
  const client = new Client()
  const db = levelup(opts.db, {
    valueEncoding: 'json',
    db: opts.leveldown || leveldown
  })

  const api = {
    products,
    createUnsecuredCreditApplication
  }

  return api

  function callMethod ({ url, scope, args, verb="GET"}, cb) {
    getClientCredentials(scope, function (err, credentials) {
      if (err) return cb(err)

      verb = verb.toLowerCase()
      args = prepArgs(args, credentials)
      cb = wrapCB(cb)
      client[verb](url, args, cb)
    })
  }

  function prepArgs (args={}, credentials) {
    const extended = {
      headers: extend({
        Authorization: 'Bearer ' + credentials.access_token,
        uuid: uuid.v4(),
        Accept: 'application/json',
        client_id: client_id
      }, args.headers || {})
    }

    if (args.data) extended.data = args.data

    return extended
  }

  function wrapCB (cb) {
    return function (data, response) {
      if (response.statusCode !== 200) {
        const err = Buffer.isBuffer(data) ? data.toString() : JSON.stringify(data)
        return cb(new Error(err))
      }

      cb(null, data)
    }
  }


  function getClientCredentials (scope, cb) {
    const key = 'credentials:' + scope
    if (cache[key]) {
      return process.nextTick(function () {
        cb(null, cache[key])
      })
    }

    dbFirst(key, getNewClientCredentials.bind(null, scope), cb)
  }

  function dbFirst (key, fallback, cb) {
    db.get(key, function (err, val) {
      if (val) return cb(null, val)

      fallback(function (err, val) {
        if (err) return cb(err)

        db.put(key, val, function (err) {
          if (err) return cb(err)

          cache[key] = val
          cb(null, val)
        })
      })
    })
  }

  function getNewClientCredentials (scope, cb) {
    client.post("https://sandbox.apihub.citi.com/gcb/api/clientCredentials/oauth2/token/sg/gcb", {
      headers: {
        Accept: 'application/json',
        "Content-Type": 'application/x-www-form-urlencoded',
        "Authorization": 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
      },
      data: querystring.stringify({
        grant_type: "client_credentials",
        scope: scope
      })
    }, wrapCB(cb))
  }

  function products (start, cb) {
    if (typeof start === 'function') {
      cb = start
      start = 0
    }

    callMethod({
      url: "https://sandbox.apihub.citi.com/gcb/api/v1/apac/onboarding/products",
      verb: "GET",
      scope: '/api',
      args: {
        headers: {
          nextStartIndex: start || 0
        }
      }
    }, function (err, result) {
      if (err) return cb(err)

      const products = result.products
      products.forEach(p => {
        if (p.organisation) {
          p.organization = p.organisation
          delete p.organisation
        }
      })

      cb(null, products)
    })
  }

  function createUnsecuredCreditApplication (opts, cb) {
    typeforce({
      productType: types.productType,
      product: types.product,
      applicant: types.applicant
    }, opts)

    const { productType, product, applicant } = opts
    const data = {
      applicant,
      product: {
        [productType]: pick(product, 'productCode', 'sourceCode', 'organization', 'logo')
      }
    }

    callMethod({
      url: "https://sandbox.apihub.citi.com/gcb/api/v1/apac/onboarding/products/unsecured/applications",
      verb: "POST",
      scope: '/api',
      args: {
        data: JSON.stringify(data)
      }
    }, cb)
  }
}

function pick (obj) {
  const props = Array.isArray(arguments[1]) ? arguments[1] : Array.prototype.slice.call(arguments, 1)
  const picked = {}
  for (var i = 0; i < props.length; i++) {
    const p = props[i]
    picked[p] = obj[p]
  }

  return picked
}
